import React, { useState, useEffect, useRef } from "react";
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
    const [completedWalks, setCompletedWalks] = useState([]);
    const [isLoadingCompletedWalks, setIsLoadingCompletedWalks] = useState(false);

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
    
    // Fetch user's completed walks
    const fetchCompletedWalks = async (userId) => {
        if (!userId) return;
        
        setIsLoadingCompletedWalks(true);
        try {
            const response = await axios.get(`http://localhost:3000/walks/logs`);
            
            // Filter walk logs for the current user
            const userCompletedWalks = response.data.filter(walkLog => 
                walkLog.userId?._id === userId && 
                (walkLog.status === 'pending' || walkLog.status === 'completed')
            );
            
            setCompletedWalks(userCompletedWalks);
        } catch (error) {
            console.error("Error fetching completed walks:", error);
        } finally {
            setIsLoadingCompletedWalks(false);
        }
    };
    
    // Check if a user has already completed a walk at this time slot
    const hasCompletedWalkAtTimeSlot = (date, time) => {
        if (!completedWalks.length) return false;
        
        return completedWalks.some(walk => walk.date === date && walk.time === time);
    };

    useEffect(() => {
        if (user?.id) {
            fetchCompletedWalks(user.id);
        }
    }, [user]);

    const handleSelectWalk = async (walkId, timeSlot) => {
        try {
            // Check waiver status
            const waiverResponse = await axios.get(`http://localhost:3000/users/profile/${user.id}`);
            if (!waiverResponse.data.waiverSigned) {
                alert("You must sign the waiver before scheduling a walk.");
                navigate("/waiver");
                return;
            }
            
            // Check if user has already completed a walk at this time slot
            const walk = availableTimesData.find(w => w._id === walkId);
            if (walk && hasCompletedWalkAtTimeSlot(walk.date, timeSlot)) {
                toast.error("You have already completed a walk at this time slot. Please select a different time.");
                return;
            }
            
            // Proceed to select the walk if waiver is signed
            const response = await axios.post(`http://localhost:3000/walks/select-walk/${walkId}`, {
                userId: user.id,
                timeSlot,
            });
            
            // Fully refresh the available times data instead of just filtering out the selected walk
            await fetchTimeSlotAvailability();
            
            // If we're on the same date that was selected, update the filtered walks
            if (selectedDate) {
                const updatedAvailableTimes = await fetchTimeSlotAvailability();
                const updatedWalksForDate = updatedAvailableTimes.filter(walk => walk.date === selectedDate);
                setFilteredWalks(updatedWalksForDate);
            }
            
            toast.success("Walk successfully selected!");
        } catch (error) {
            console.error("Error selecting walk:", error);
            if (error.response && error.response.data && error.response.data.error) {
                // Display the specific error message from the server
                toast.error(`Failed to select walk: ${error.response.data.error}`);
            } else {
                toast.error("Failed to select walk.");
            }
        }
    };

    // Fetch slot availability information for each time slot
    const fetchTimeSlotAvailability = async () => {
        try {
            // Clear existing events first to prevent duplicates
            setEvents([]);
            
            const response = await axios.get("http://localhost:3000/walks/available-times");
            const walks = response.data;
            
            // Process the walks data to include availability information
            const enhancedWalks = walks.map(walk => {
                // If the walk doesn't have timeSlots array, create default values
                if (!walk.timeSlots || walk.timeSlots.length === 0) {
                    return {
                        ...walk,
                        timeSlotAvailability: walk.availableTimes.reduce((acc, time) => {
                            acc[time] = { 
                                bookedCount: 0, 
                                maxBookings: 4, 
                                isAvailable: true 
                            };
                            return acc;
                        }, {})
                    };
                }
                
                // Create a mapping of time slots to their availability
                const timeSlotAvailability = {};
                walk.timeSlots.forEach(slot => {
                    timeSlotAvailability[slot.time] = {
                        bookedCount: slot.bookedCount,
                        maxBookings: slot.maxBookings,
                        isAvailable: slot.bookedCount < slot.maxBookings
                    };
                });
                
                return {
                    ...walk,
                    timeSlotAvailability
                };
            });
            
            setAvailableTimesData(enhancedWalks);
            
            // Highlight dates with available walks
            const availableTimeEvents = enhancedWalks.map((walk) => ({
                date: walk.date,
                display: 'background',
                className: 'has-available-time'
            }));
            
            setEvents(availableTimeEvents);
            
            // Re-filter walks for selected date if a date is already selected
            if (selectedDate) {
                const walksForDate = enhancedWalks.filter((walk) => walk.date === selectedDate);
                setFilteredWalks(walksForDate);
            }
            
            return enhancedWalks;
        } catch (error) {
            console.error("Error fetching available times:", error);
            return [];
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
        fetchTimeSlotAvailability();
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
            await fetchTimeSlotAvailability();
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
                fetchTimeSlotAvailability();
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
                fetchTimeSlotAvailability();
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

    // Function to generate time slots at 30-minute intervals within shelter hours
    const generateTimeOptions = (date) => {
        // Find shelter hours for this date
        const shelterTime = shelterTimes.find(st => st.date === date);
        
        if (!shelterTime) {
            return [];
        }
        
        const { startTime, endTime } = shelterTime;
        const options = [];
        
        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Create a Date object for easier time manipulation
        const startDate = new Date();
        startDate.setHours(startHour, startMinute, 0, 0);
        
        const endDate = new Date();
        endDate.setHours(endHour, endMinute, 0, 0);
        
        // Generate time slots at 30-minute intervals
        const currentTime = new Date(startDate);
        
        while (currentTime <= endDate) {
            const hours = currentTime.getHours().toString().padStart(2, '0');
            const minutes = currentTime.getMinutes().toString().padStart(2, '0');
            options.push(`${hours}:${minutes}`);
            
            // Add 30 minutes
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        
        return options;
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

    // Generate 30-minute interval options for shelter hours
    const generate30MinTimeOptions = () => {
        const options = [];
        for (let i = 0; i < 24 * 60; i += 30) {
            const hours = String(Math.floor(i / 60)).padStart(2, '0');
            const minutes = String(i % 60).padStart(2, '0');
            options.push(`${hours}:${minutes}`);
        }
        return options;
    };

    // Enhanced dropdown scrollable time picker component
    const EnhancedTimePicker = ({ value, onChange, options, placeholder, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const scrollContainerRef = useRef(null);
        const optionRefs = useRef({});
        
        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };
            
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);
        
        // Scroll to selected value when dropdown opens
        useEffect(() => {
            if (isOpen && value && scrollContainerRef.current && optionRefs.current[value]) {
                const scrollContainer = scrollContainerRef.current;
                const optionElement = optionRefs.current[value];
                
                // Calculate position to center the selected item
                const scrollTop = optionElement.offsetTop - 
                    (scrollContainer.clientHeight / 2) + 
                    (optionElement.offsetHeight / 2);
                
                scrollContainer.scrollTop = scrollTop;
            }
        }, [isOpen, value]);
        
        // Toggle dropdown
        const toggleDropdown = () => {
            if (!disabled) {
                setIsOpen(!isOpen);
            }
        };
        
        // Handle option selection
        const handleSelect = (option) => {
            onChange({ target: { value: option } });
            setIsOpen(false);
        };
        
        return (
            <div ref={dropdownRef} className="relative w-full">
                {/* Selected value display / dropdown trigger */}
                <div 
                    onClick={toggleDropdown}
                    className={`
                        w-full px-4 py-2 rounded-md border flex justify-between items-center cursor-pointer
                        ${disabled 
                            ? 'bg-gray-100 text-gray-500 border-gray-300' 
                            : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'}
                        ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
                    `}
                >
                    <span className={!value ? 'text-gray-500' : ''}>
                        {value ? formatTimeForDisplay(value) : placeholder || "Select time"}
                    </span>
                    <svg 
                        className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                
                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div 
                        ref={scrollContainerRef}
                        className="max-h-60 overflow-y-auto py-1 scrollbar-thin"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {options.length > 0 ? (
                            options.map((option) => (
                                <div
                                    key={option}
                                    ref={(el) => optionRefs.current[option] = el}
                                    className={`
                                        px-4 py-2 cursor-pointer text-sm hover:bg-blue-50
                                        ${value === option ? 'bg-blue-100 font-medium' : ''}
                                    `}
                                    onClick={() => handleSelect(option)}
                                >
                                    {formatTimeForDisplay(option)}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                                No times available
                            </div>
                        )}
                    </div>
                    </div>
                )}
                
                {/* Custom scrollbar styling */}
                <style jsx>{`
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }
                    
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 3px;
                    }
                    
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 3px;
                    }
                    
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: #a1a1a1;
                    }
                `}</style>
            </div>
        );
    };

    // Render the time slot cards with visual indicators for completed walks
    const renderTimeSlotCards = () => {
        return filteredWalks.map((walk, index) =>
            walk.availableTimes.map((timeSlot, idx) => {
                // Get availability info for this time slot
                const slotInfo = walk.timeSlotAvailability && walk.timeSlotAvailability[timeSlot];
                const bookedCount = slotInfo ? slotInfo.bookedCount : 0;
                const maxBookings = slotInfo ? slotInfo.maxBookings : 4;
                const isFullyBooked = bookedCount >= maxBookings;
                
                // Check if the user has already completed a walk at this time
                const alreadyCompletedWalk = hasCompletedWalkAtTimeSlot(walk.date, timeSlot);
                
                let cardStyle = "bg-white border-gray-300";
                let statusMessage = null;
                
                if (isFullyBooked) {
                    cardStyle = "bg-red-50 border-red-300";
                    statusMessage = <div className="mt-2 py-1 px-2 bg-red-100 text-red-800 text-sm font-medium rounded">
                        Not Available
                    </div>;
                } else if (alreadyCompletedWalk) {
                    cardStyle = "bg-gray-100 border-gray-400";
                    statusMessage = <div className="mt-2 py-1 px-2 bg-gray-200 text-gray-700 text-sm font-medium rounded">
                        Already Completed
                    </div>;
                }
                
                return (
                <div 
                    key={`${index}-${idx}`} 
                    className={`${cardStyle} shadow-md rounded-lg p-6 border flex flex-col justify-between`}
                >
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                            Marshall: {walk.marshall?.firstName || "Unknown"}
                        </h2>
                        <p className="text-gray-600">Date: {walk.date}</p>
                        <p className="text-gray-600">Time: {formatTimeForDisplay(timeSlot)}</p>
                        
                        {/* Display booking capacity */}
                        <div className="mt-2">
                            <div className="flex justify-between items-center text-sm">
                                <span>Available Slots:</span>
                                <span className={`font-medium ${isFullyBooked ? 'text-red-600' : 'text-green-600'}`}>
                                    {maxBookings - bookedCount} of {maxBookings}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                    className={`${isFullyBooked ? 'bg-red-600' : 'bg-green-600'} h-2 rounded-full`} 
                                    style={{ width: `${(bookedCount / maxBookings) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                        
                        {statusMessage}
                    </div>

                    <div className="flex gap-2 mt-4">
                        {user?.id !== walk.marshall?._id && (
                            <button
                                className={`px-4 py-2 rounded-md ${
                                    isFullyBooked || alreadyCompletedWalk 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                                onClick={() => !isFullyBooked && !alreadyCompletedWalk && handleSelectWalk(walk._id, timeSlot)}
                                disabled={isFullyBooked || alreadyCompletedWalk}
                            >
                                {isFullyBooked 
                                  ? 'Fully Booked' 
                                  : alreadyCompletedWalk 
                                    ? 'Already Walked' 
                                    : 'Select'}
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
            )})
        );
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
                                onChange={(e) => {
                                    setAvailableDate(e.target.value);
                                    setAvailableTime(''); // Reset time when date changes
                                }}
                                required
                                className="form-input"
                            />
                            
                            {availableDate ? (
                                <EnhancedTimePicker
                                    value={availableTime}
                                    onChange={(e) => setAvailableTime(e.target.value)}
                                    options={generateTimeOptions(availableDate)}
                                    placeholder="Select Time"
                                    disabled={!availableDate}
                                />
                            ) : (
                                <div className="relative w-full">
                                    <div className="w-full px-4 py-2 rounded-md border bg-gray-100 text-gray-500 border-gray-300 flex justify-between items-center">
                                        <span className="text-gray-500">Select a date first</span>
                                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                className="form-button small-button"
                                disabled={!availableDate || !availableTime}
                            >
                                Add Time
                            </button>
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
                            <EnhancedTimePicker
                                value={shelterStartTime}
                                onChange={(e) => setShelterStartTime(e.target.value)}
                                options={generate30MinTimeOptions()}
                                placeholder="Select start time"
                            />
                            </div>
                            <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                            <EnhancedTimePicker
                                value={shelterEndTime}
                                onChange={(e) => setShelterEndTime(e.target.value)}
                                options={generate30MinTimeOptions().filter(time => time > shelterStartTime)}
                                placeholder="Select end time"
                                disabled={!shelterStartTime}
                            />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                            disabled={!shelterDate || !shelterStartTime || !shelterEndTime}
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
                
                {/* If date is selected and no slots, show a message */}
                {selectedDate && filteredWalks.length === 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 text-center">
                            No available walk times for the selected date. Please select another date.
                        </p>
                    </div>
                )}
                
                <div className="mt-10 mb-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingCompletedWalks ? (
                        <div className="col-span-full text-center py-8">
                            <p className="text-gray-600">Loading available walks...</p>
                        </div>
                    ) : renderTimeSlotCards()}
                </div>
        </div>
    );
};

export default Walk;