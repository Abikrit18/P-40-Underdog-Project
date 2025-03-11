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


const Walk = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [time, setTime] = useState("");
    const [availableDate, setAvailableDate] = useState("");
    const [availableTime, setAvailableTime] = useState("");
    const [availableTimesData, setAvailableTimesData] = useState([]);
    const [filteredWalks, setFilteredWalks] = useState([]);

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

    const fetchScheduledWalks = async () => {
        try {
            const response = await axios.get("http://localhost:3000/walks");
            const scheduledEvents = response.data
                .filter((walk) => walk.userid)
                .map((walk) => ({
                    title: `Walk with ${walk.marshallName}`,
                    date: walk.date,
                }));

            const availableTimeEvents = response.data
                .filter((walk) => walk.availableTimes && walk.availableTimes.length > 0)
                .map((walk) => ({
                    date: walk.date,
                    display: 'background',
                    className: 'has-available-time'
                }));

            setEvents([...scheduledEvents, ...availableTimeEvents]);
        } catch (error) {
            console.error("Error fetching scheduled walks:", error);
        }
    };

    const handleSelectWalk = async (walkId, timeSlot) => {
        try {
            await axios.post(`http://localhost:3000/walks/select-walk/${walkId}`, {
                userId: user.id,
                timeSlot,
            });
    
            // Remove the walk from UI
            setAvailableTimesData(prevData => prevData.filter(walk => walk._id !== walkId));
    
            alert("Walk successfully selected");
        } catch (error) {
            console.error("Error selecting walk:", error);
            alert("Failed to select walk.");
        }
    };

    const fetchAvailableTimes = async () => {
        try {
            const response = await axios.get("http://localhost:3000/walks/available-times");
    
            const updatedData = response.data.map((walk) => ({
                ...walk,
                isSelectable: !walk.userid // Only selectable if not already assigned
            }));
    
        setAvailableTimesData(updatedData);
        
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
    useEffect(() => {
        fetchScheduledWalks();
        fetchAvailableTimes();
    }, []);

    const handleDateClick = (arg) => {
        const selected = arg.dateStr;
        setSelectedDate(selected);
        // Filter walks based on the selected date
        const walksForDate = availableTimesData.filter((walk) => walk.date === selected);
        setFilteredWalks(walksForDate);
        setAvailableDate(selected); // Auto-set the form date field
    };
    // Removed handleAddTime function as modal functionality is removed.

    const handleAvailableTimeSubmit = async (e) => {
        e.preventDefault();
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
                {/* Modal functionality removed */}
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
                                type="text"
                                value={availableTime}
                                onChange={(e) => setAvailableTime(e.target.value)}
                                placeholder="Enter time (e.g., 2:00 PM)"
                                required
                                className="form-input"
                            />
                            <button type="submit" className="form-button small-button">Add Time</button>
                        </form>
                    </div>
                )}
            </div>
            <div className="mt-6 w-full flex flex-wrap gap-4 justify-start mb-10 px-4">
            {filteredWalks.map((walk, index) =>
        walk.availableTimes.map((timeSlot, idx) => (
            <div key={`${index}-${idx}`} className="bg-white shadow-md rounded-lg p-4 border border-gray-300 w-[calc(33.333%-1rem)]">
                <h2 className="text-lg font-semibold text-gray-800">
                    Marshall: {walk.marshall?.firstName || "Unknown"}
                </h2>
                <p className="text-gray-600">Date: {walk.date}</p>
                <p className="text-gray-600">Time: {timeSlot}</p>
                {/* Available Slots removed */}

                <div className="flex gap-2 mt-2">
                    {user?.id !== walk.marshall?._id && (
                        <button
                            className={`px-4 py-2 ${walk.isSelectable ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md`}
                            onClick={() => walk.isSelectable && handleSelectWalk(walk._id, timeSlot)}
                            disabled={!walk.isSelectable}
                        >
                            {walk.isSelectable ? 'Select' : 'Unavailable'}
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