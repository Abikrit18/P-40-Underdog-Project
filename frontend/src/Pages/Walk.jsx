import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Walk = () => {
    const navigate = useNavigate();
    const [marshalls, setMarshalls] = useState([]);
    const [selectedMarshall, setSelectedMarshall] = useState("");
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState("");
    const [timeSlotsByDate, setTimeSlotsByDate] = useState({});
    const [editingIndex, setEditingIndex] = useState(null);
    const [newTime, setNewTime] = useState("");
    const [user, setUser] = useState();

    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                console.log(decodedToken);
                setUser(decodedToken);

                console.log(user); // For debugging
            } catch (error) {
                console.error('Failed to decode token:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        const fetchMarshalls = async () => {
            try {
                const response = await axios.get("http://localhost:3000/users");
                const marshallUsers = response.data.filter(user => user.role === "Marshall");
                setMarshalls(marshallUsers);
            } catch (error) {
                console.error("Error fetching Marshalls:", error);
            }
        };
        fetchMarshalls();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const handleDateChange = (newDate) => setDate(newDate);

    const handleAddOrEditTime = () => {
        const formattedDate = formatDate(date);
        const currentDate = formatDate(new Date());

        if (formattedDate < currentDate) {
            alert("You cannot add a time slot for past dates.");
            return;
        }

        if (!newTime) {
            alert("Please enter a valid time.");
            return;
        }

        const updatedSlots = { ...timeSlotsByDate };

        if (!updatedSlots[formattedDate]) updatedSlots[formattedDate] = [];

        if (editingIndex !== null) {
            updatedSlots[formattedDate][editingIndex] = newTime;
            alert("Time slot updated successfully.");
        } else {
            if (updatedSlots[formattedDate].includes(newTime)) {
                alert("This time slot already exists.");
                return;
            }
            updatedSlots[formattedDate].push(newTime);
            alert("Time slot added successfully.");
        }

        setTimeSlotsByDate(updatedSlots);
        setNewTime("");
        setEditingIndex(null);
    };

    const handleEditTime = (index) => {
        const formattedDate = formatDate(date);
        setNewTime(timeSlotsByDate[formattedDate][index]);
        setEditingIndex(index);
    };

    const handleDeleteTime = (index) => {
        const formattedDate = formatDate(date);
        const updatedSlots = { ...timeSlotsByDate };
        updatedSlots[formattedDate] = updatedSlots[formattedDate].filter((_, i) => i !== index);
        setTimeSlotsByDate(updatedSlots);
    };

    const handleSchedule = async () => {
        if (!selectedMarshall || !time) {
            alert("Please select a marshall and time slot to schedule a walk.");
            return;
        }

        if (!user) {
            alert("Please log in to schedule a walk.");
            navigate("/login");
            return;
        }

        const walkData = {
            userid: user.id,  // Send only the user ID
            marshall: selectedMarshall,
            date: formatDate(date),
            time,
        };

        try {
            const response = await axios.post("http://localhost:3000/walks", walkData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 201) {
                alert("Walk scheduled successfully!");
                navigate("/");
            }
        } catch (error) {
            console.error("Error scheduling walk:", error);
            alert("Failed to schedule walk. Please try again.");
        }
    };

    const formattedDate = formatDate(date);
    const availableTimes = timeSlotsByDate[formattedDate] || [];

    return (
        <div className="flex flex-col items-center gap-6 p-6 min-h-screen justify-center bg-gray-100">
            <h1 className="text-3xl font-bold text-blue-700">Walk our Dogs</h1>

            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center border-4 border-blue-200">
                <label className="block text-lg font-medium text-gray-700">Select a Marshall</label>
                <select
                    className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={selectedMarshall}
                    onChange={(e) => setSelectedMarshall(e.target.value)}
                >
                    <option value="">-- Choose a Marshall --</option>
                    {marshalls.map((marshall) => (
                        <option key={marshall._id} value={marshall._id}>
                            {marshall.firstName} {marshall.lastName}
                        </option>
                    ))}
                </select>

                <label className="block text-lg font-medium text-gray-700 mt-6">Select a Date</label>
                <div className="bg-red-900 p-4 rounded-lg mt-2 flex justify-center">
                    <Calendar
                        onChange={handleDateChange}
                        value={date}
                        className="w-full border border-gray-300 rounded-lg"
                    />
                </div>

                <label className="block text-lg font-medium text-gray-700 mt-6">Select a Time</label>
                {availableTimes.length > 0 ? (
                    <select
                        className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    >
                        <option value="">-- Choose a Time --</option>
                        {availableTimes.map((slot, index) => (
                            <option key={index} value={slot}>{slot}</option>
                        ))}
                    </select>
                ) : (
                    <p className="text-red-500 font-medium mt-2">No time slots available for {formattedDate}.</p>
                )}

                <button
                    className={`w-full mt-4 p-2 font-bold rounded-md transition-all ${availableTimes.length === 0 ? "bg-gray-400 text-gray-700 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                    onClick={handleSchedule}
                    disabled={availableTimes.length === 0}
                >
                    Schedule Walk
                </button>
            </div>
            {user?.role === "Marshall" && (
                <div className="bg-red-900 shadow-md rounded-lg p-10 w-full max-w-md mt-8 border-6 border-yellow-500">
                    <label className="block text-lg font-medium text-white ml-26">
                        {editingIndex !== null ? "Edit Time Slot" : "Add a New Time Slot"}
                    </label>
                    <div className="mt-2 flex flex-col items-center w-auto">
                        <input
                            type="text"
                            className="bg-white py-1 px-16 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 w-auto text-center"
                            placeholder="e.g., 4:00 PM"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                        />
                        <button
                            className="mt-4 py-1 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
                            onClick={handleAddOrEditTime}
                        >
                            {editingIndex !== null ? "Update" : "Add"}
                        </button>
                    </div>

                    <label className="block text-lg font-medium text-white mt-12 ml-14">Available Times for {formattedDate}</label>
                    {availableTimes.length > 0 ? (
                        <ul className="mt-4 space-y-2 mr-8">
                            {availableTimes.map((slot, index) => (
                                <li key={index} className="flex justify-between items-center p-2 bg-gray-100 rounded-lg shadow-sm">
                                    <span className="text-gray-800 font-medium">{slot}</span>
                                    <div className="flex gap-4">
                                        <button
                                            className="text-blue-600 hover:underline"
                                            onClick={() => handleEditTime(index)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-red-600 hover:underline"
                                            onClick={() => handleDeleteTime(index)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-200 mt-4 ml-30"> No time added </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Walk;