import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";

const Walk = () => {
    const navigate = useNavigate();
    const [dogs, setDogs] = useState([]);
    const [selectedDog, setSelectedDog] = useState("");
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState("");
    const [timeSlotsByDate, setTimeSlotsByDate] = useState({});
    const [editingIndex, setEditingIndex] = useState(null);
    const [newTime, setNewTime] = useState("");

    useEffect(() => {
        const fetchDogs = async () => {
            try {
                const response = await axios.get("http://localhost:3000/dogs");
                setDogs(response.data);
            } catch (error) {
                console.error("Error fetching dog names:", error);
            }
        };
        fetchDogs();
    }, []);

    const formatDate = (date) => date.toISOString().split("T")[0];

    const handleDateChange = (newDate) => setDate(newDate);

    const handleAddOrEditTime = () => {
        if (!newTime) {
            alert("Please enter a valid time.");
            return;
        }
        const formattedDate = formatDate(date);
        const updatedSlots = { ...timeSlotsByDate };
        if (!updatedSlots[formattedDate]) updatedSlots[formattedDate] = [];

        if (editingIndex !== null) {
            updatedSlots[formattedDate][editingIndex] = newTime;
        } else {
            if (!updatedSlots[formattedDate].includes(newTime)) {
                updatedSlots[formattedDate].push(newTime);
            } else {
                alert("This time slot already exists for this date.");
                return;
            }
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

    const handleSchedule = () => {
        if (selectedDog && time) {
            alert(`Walk scheduled for ${selectedDog} on ${date.toDateString()} at ${time}`);
            navigate("/");
        } else {
            alert("Please select a dog and time slot to schedule a walk.");
        }
    };

    const formattedDate = formatDate(date);
    const availableTimes = timeSlotsByDate[formattedDate] || [];

    return (
        <div className="flex flex-col items-center gap-6 p-6 min-h-screen justify-center bg-gray-100">
            <h1 className="text-3xl font-bold text-blue-700">Walk our Dogs</h1>

            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center border-4 border-blue-200">
                <label className="block text-lg font-medium text-gray-700">Select a Dog</label>
                <select
                    className="w-full p-3 mt-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={selectedDog}
                    onChange={(e) => setSelectedDog(e.target.value)}
                >
                    <option value="">-- Choose a Dog --</option>
                    {dogs.map((dog, index) => (
                        <option key={index} value={dog.name}>{dog.name}</option>
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


                <label className="block text-lg font-medium text-white mt-12 ml-16">Available Times for {formattedDate}</label>
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
                    <p className="text-gray-200 mt-2 ml-16">No available time slots for this date.</p>
                )}
            </div>
        </div>
    );
};

export default Walk;
