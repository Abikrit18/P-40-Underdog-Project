import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../App.css";
import { toast } from "react-toastify";

const Walk = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableDate, setAvailableDate] = useState("");
    const [availableTime, setAvailableTime] = useState("");
    const [availableTimesData, setAvailableTimesData] = useState([]);
    const [filteredWalks, setFilteredWalks] = useState([]);
    const [shelterTimes, setShelterTimes] = useState([]);
    const [shelterDate, setShelterDate] = useState("");
    const [shelterStartTime, setShelterStartTime] = useState("");
    const [shelterEndTime, setShelterEndTime] = useState("");
    const [shelterTimesLoading, setShelterTimesLoading] = useState(true);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, [token]);

    const handleSelectWalk = async (walkId, timeSlot) => {
        try {
            // Check waiver status
        const waiverResponse = await axios.get(`http://localhost:3000/users/profile/${user.id}`);
        if (!waiverResponse.data.waiverSigned) {
            alert("You must sign the waiver before scheduling a walk.");
            navigate("/waiver");
            return;
        }

            // Proceed to select the walk if waiver is signed
            await axios.post(`http://localhost:3000/walks/select-walk/${walkId}`, {
                userId: user.id,
                timeSlot,
            });

            setAvailableTimesData(prevData => prevData.filter(walk => walk._id !== walkId));
            alert("Walk successfully selected!");
        } catch (error) {
            console.error("Error selecting walk:", error);
            alert("Failed to select walk.");
        }
    };

    const fetchAvailableTimes = async () => {
        try {
            const response = await axios.get("http://localhost:3000/walks/available-times");
    
            setAvailableTimesData(response.data);
        
        // Highlight dates with available walks
        const availableTimeEvents = response.data.map((walk) => ({
            date: walk.date,
            display: 'background',
            className: 'has-available-time'
        }));

        setEvents((prevEvents) => [...prevEvents, ...availableTimeEvents]);
        } catch (error) {
            console.error("Error fetching available times:", error);
        }
    };

    const fetchShelterTimes = async () => {
        try {
          const response = await axios.get("http://localhost:3000/shelter-times", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });
          setShelterTimes(response.data);
          setShelterTimesLoading(false);
        } catch (error) {
          console.error("Error fetching shelter times:", error);
          toast.error("Failed to load shelter hours");
          setShelterTimesLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableTimes();
        fetchShelterTimes();
    }, []);

    const handleDateClick = (arg) => {
        const selected = arg.dateStr;
        setSelectedDate(selected);
        // Filter walks based on the selected date
        const walksForDate = availableTimesData.filter((walk) => walk.date === selected);
        setFilteredWalks(walksForDate);
        setAvailableDate(selected); // Auto-set the form date field
    };

    // Update your existing handleAvailableTimeSubmit function
    const handleAvailableTimeSubmit = async (e) => {
        e.preventDefault();
        
        // Check if the selected time is within shelter hours
        if (user?.role === 'Marshall' && !isWithinShelterHours(availableDate, availableTime)) {
        toast.error("You can only schedule walks during shelter hours for this date");
        return;
        }
        
        // Your existing code for submitting available time
        try {
        // Your existing axios call and state updates
        const today = new Date().setHours(0, 0, 0, 0);
        const selected = new Date(availableDate).setHours(0, 0, 0, 0);
    
        if (selected < today) {
            return alert("Cannot add time for past dates.");
        }
    
        if (!availableDate || !availableTime) return alert("Please fill in both fields.");
    
        try {
            await axios.post("http://localhost:3000/walks/add-time", {
                marshall: user.id,
                date: availableDate,
                time: availableTime,
            });
            alert("Available time added successfully!");
    
            // Re-fetch available times to ensure marshall's details are updated
            await fetchAvailableTimes();
            setAvailableDate("");
            setAvailableTime("");
        } catch (error) {
            console.error("Error adding available time:", error);
            alert("Failed to add available time. Please check the backend server.");
        }
        } catch (error) {
        // Your existing error handling
        console.error("Error adding available time:", error);
        alert("Failed to add available time. Please check the backend server.");
        }
    };

    const handleEditTime = (walk, timeSlot) => {
        const newTime = prompt("Enter new time:", timeSlot);
        if (newTime && newTime !== timeSlot) {
            axios.put(`http://localhost:3000/walks/update-time/${walk._id}`, {
                oldTime: timeSlot,
                newTime: newTime
            })
            .then(response => {
                alert("Time updated successfully!");
                fetchAvailableTimes();
            })
            .catch(error => {
                console.error("Error updating time:", error);
                alert("Failed to update time.");
            });
        }
    };

    const handleDeleteTime = async (walkId, timeSlot) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this time?");
        if (confirmDelete) {
            try {
                await axios.delete(`http://localhost:3000/walks/delete-time/${walkId}`, {
                    data: { time: timeSlot }
                });
                alert("Time deleted successfully!");
                fetchAvailableTimes();
            } catch (error) {
                console.error("Error deleting time:", error);
                alert("Failed to delete time.");
            }
        }
    };

    const handleShelterTimeSubmit = async (e) => {
        e.preventDefault();
        
        if (!shelterDate || !shelterStartTime || !shelterEndTime) {
          toast.error("Please fill in all shelter time fields");
          return;
        }
        
        // Validate start time is before end time
        if (shelterStartTime >= shelterEndTime) {
          toast.error("Start time must be before end time");
          return;
        }
        
        try {
          await axios.post(
            "http://localhost:3000/shelter-times", 
            {
              date: shelterDate,
              startTime: shelterStartTime,
              endTime: shelterEndTime
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
          );
          
          toast.success("Shelter hours added successfully");
          fetchShelterTimes();
          
          // Reset form
          setShelterDate("");
          setShelterStartTime("");
          setShelterEndTime("");
        } catch (error) {
          console.error("Error adding shelter time:", error);
          toast.error("Failed to add shelter hours");
        }
    };

    const handleDeleteShelterTime = async (id) => {
        if (window.confirm("Are you sure you want to delete these shelter hours?")) {
          try {
            await axios.delete(`http://localhost:3000/shelter-times/${id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            toast.success("Shelter hours deleted");
            fetchShelterTimes();
          } catch (error) {
            console.error("Error deleting shelter time:", error);
            toast.error("Failed to delete shelter hours");
          }
        }
    };

    const isWithinShelterHours = (date, time) => {
        // Find the shelter time for this date
        const shelterTime = shelterTimes.find(st => st.date === date);
        
        // If no shelter time is set for this date, return false
        if (!shelterTime) return false;
        
        // Check if the time is within the shelter time range
        return time >= shelterTime.startTime && time <= shelterTime.endTime;
    };

    // Alternative custom formatting function if you prefer
    const formatTimeForDisplay = (timeString) => {
        if (!timeString) return "N/A";
        
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
            
            return `${hour12}:${minutes} ${ampm}`;
        } catch (error) {
            console.error("Error formatting time:", error);
            return timeString;
        }
    };

    return (
        <div>
            <h1 className="calendar-title" style={{ textAlign: "center", margin: "20px 0" }}>Walk Scheduling Calendar</h1>
            <div className="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    selectable={true}
                    dateClick={handleDateClick}
                    events={events}
                    height="auto"
                />
                {user?.role === "Marshall" && (
                    <div className="mt-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h3 className="text-blue-800 font-medium mb-2">Available Shelter Hours</h3>
                        {shelterTimesLoading ? (
                        <p>Loading shelter hours...</p>
                        ) : shelterTimes.length === 0 ? (
                        <p className="text-red-500">No shelter hours available. Please contact admin.</p>
                        ) : (
                        <div className="space-y-1">
                            {shelterTimes.map(time => (
                            <div key={time._id} className="text-sm">
                                <span className="font-medium">{time.date}:</span> {formatTimeForDisplay(time.startTime)} to {formatTimeForDisplay(time.endTime)}
                            </div>
                            ))}
                        </div>
                        )}
                        <p className="mt-2 text-sm text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        You can only schedule walks during these hours
                        </p>
                    </div>
                    )}
                {user?.role === "Marshall" && (
                    <div className="form-container">
                        <form onSubmit={handleAvailableTimeSubmit} className="add-time-form">
                            <input
                                type="date"
                                value={availableDate}
                                onChange={(e) => setAvailableDate(e.target.value)}
                                required
                                className="form-input"
                            />
                            <input
                                type="time"
                                value={availableTime}
                                onChange={(e) => setAvailableTime(e.target.value)}
                                required
                                className="form-input"
                            />
                            <button type="submit" className="form-button small-button">Add Time</button>
                        </form>
                    </div>
                )}
                </div>
                {user?.role === "admin" && (
                    <div className="mt-8 bg-white shadow-md rounded-lg p-6 border border-gray-300">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Set Shelter Hours</h2>
                        <p className="text-gray-600 mb-4">Define the time windows when marshalls can schedule dog walks</p>
                        
                        <form onSubmit={handleShelterTimeSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={shelterDate}
                                onChange={(e) => setShelterDate(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                value={shelterStartTime}
                                onChange={(e) => setShelterStartTime(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <input
                                type="time"
                                value={shelterEndTime}
                                onChange={(e) => setShelterEndTime(e.target.value)}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                        >
                            Add Shelter Hours
                        </button>
                        </form>
                        
                        {/* Display Current Shelter Hours */}
                        <div className="mt-6">
                        <h3 className="text-lg font-medium text-gray-800 mb-2">Current Shelter Hours</h3>
                        {shelterTimesLoading ? (
                            <p>Loading shelter hours...</p>
                        ) : shelterTimes.length === 0 ? (
                            <p className="text-gray-500">No shelter hours have been set</p>
                        ) : (
                            <div className="space-y-2 mt-3">
                            {shelterTimes.map(time => (
                                <div 
                                key={time._id} 
                                className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded-md"
                                >
                                <div>
                                    <span className="font-medium">{time.date}</span>: 
                                    <span className="ml-2">{formatTimeForDisplay(time.startTime)} to {formatTimeForDisplay(time.endTime)}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteShelterTime(time._id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                </div>
                            ))}
                            </div>
                        )}
                        </div>
                    </div>
                    )}

                {user?.totalWalks === 0 && !user?.waiverSigned && (
                    <div className="mt-4">
                        <p className="text-red-500 font-medium">You must sign the waiver before scheduling a walk.</p>
                        <button
                            onClick={() => navigate("/waiver")}
                            className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
                        >
                            Sign Waiver
                        </button>
                    </div>
                )}
                <div className="mt-10 mb-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWalks.map((walk, index) =>
                    walk.availableTimes.map((timeSlot, idx) => (
                        <div key={`${index}-${idx}`} className="bg-white shadow-md rounded-lg p-6 border border-gray-300 flex flex-col justify-between">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Marshall: {walk.marshall?.firstName || "Unknown"}
                            </h2>
                            <p className="text-gray-600">Date: {walk.date}</p>
                            <p className="text-gray-600">Time: {formatTimeForDisplay(timeSlot)}</p>

                <div className="flex gap-2 mt-2">
                    {user?.id !== walk.marshall?._id && (
                        <button
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                            onClick={() => handleSelectWalk(walk._id, timeSlot)}
                        >
                            Select
                        </button>
                    )}
                    {user?.id === walk.marshall?._id && (
                        <>
                            <button
                                className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                                onClick={() => handleEditTime(walk, timeSlot)}
                            >
                                Edit
                            </button>
                            <button
                                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                                onClick={() => handleDeleteTime(walk._id, timeSlot)}
                            >
                                Delete
                            </button>
                        </>
                    )}
                </div>
            </div>
        ))
    )}
</div>
        </div>
    );
};

export default Walk;