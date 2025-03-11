import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const WalkLog = () => {
    const [user, setUser] = useState(null);
    const [walkLogs, setWalkLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDogs, setSelectedDogs] = useState({});
    const [notes, setNotes] = useState({});
    const [availableDogs, setAvailableDogs] = useState([
        "Max", "Bella", "Charlie", "Lucy", "Cooper", "Luna", 
        "Buddy", "Daisy", "Rocky", "Sadie", "Milo", "Bailey"
    ]);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
                fetchWalkLogs(decodedToken.id, decodedToken.role);
            } catch (error) {
                console.error("Failed to decode token:", error);
                toast.error("Authentication error. Please login again.");
            }
        }
    }, [token]);

    const fetchWalkLogs = async (userId, role) => {
        try {
            setLoading(true);
            let response;
            
            if (role === 'admin') {
                response = await axios.get("http://localhost:3000/walks/logs");
            } else if (role === 'Marshall') {
                response = await axios.get(`http://localhost:3000/walks/logs/marshall/${userId}`);
            }
            
            setWalkLogs(response.data);
            
            // Initialize selected dogs and notes for each log
            const dogsObj = {};
            const notesObj = {};
            response.data.forEach(log => {
                dogsObj[log._id] = log.dogs || [];
                notesObj[log._id] = log.notes || '';
            });
            
            setSelectedDogs(dogsObj);
            setNotes(notesObj);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching walk logs:", error);
            toast.error("Failed to fetch walk logs");
            setLoading(false);
        }
    };

    const handleDogSelection = (logId, dog) => {
        setSelectedDogs(prev => {
            const currentDogs = [...(prev[logId] || [])];
            const index = currentDogs.indexOf(dog);
            
            if (index > -1) {
                currentDogs.splice(index, 1); // Remove dog
            } else {
                currentDogs.push(dog); // Add dog
            }
            
            return { ...prev, [logId]: currentDogs };
        });
    };

    const handleNotesChange = (logId, value) => {
        setNotes(prev => ({ ...prev, [logId]: value }));
    };

    const handleSubmit = async (logId) => {
        try {
            await axios.put(`http://localhost:3000/walks/logs/${logId}`, {
                dogs: selectedDogs[logId],
                notes: notes[logId],
                status: 'completed'
            });
            
            toast.success("Walk log updated successfully");
            
            // Update local state to reflect changes
            setWalkLogs(prev => 
                prev.map(log => 
                    log._id === logId 
                        ? { 
                            ...log, 
                            dogs: selectedDogs[logId], 
                            notes: notes[logId], 
                            status: 'completed' 
                        } 
                        : log
                )
            );
        } catch (error) {
            console.error("Error updating walk log:", error);
            toast.error("Failed to update walk log");
        }
    };

    if (loading) return <div className="text-center p-8">Loading walk logs...</div>;

    return (
        <div className="container mx-auto p-6">
            <ToastContainer />
            <h1 className="text-2xl font-bold mb-6">Walk Logs</h1>
            
            {walkLogs.length === 0 ? (
                <div className="text-gray-500">No walk logs available.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border">Date</th>
                                <th className="py-2 px-4 border">Time</th>
                                <th className="py-2 px-4 border">User</th>
                                <th className="py-2 px-4 border">Marshall</th>
                                <th className="py-2 px-4 border">Dogs</th>
                                <th className="py-2 px-4 border">Notes</th>
                                <th className="py-2 px-4 border">Status</th>
                                {user?.role === 'Marshall' && (
                                    <th className="py-2 px-4 border">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {walkLogs.map((log) => (
                                <tr key={log._id} className="border-b">
                                    <td className="py-2 px-4 border">{log.date}</td>
                                    <td className="py-2 px-4 border">{log.time}</td>
                                    <td className="py-2 px-4 border">
                                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "Unknown"}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {log.marshallId ? `${log.marshallId.firstName} ${log.marshallId.lastName}` : "Unknown"}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {user?.role === 'Marshall' && log.status === 'pending' ? (
                                            <div className="flex flex-wrap gap-2">
                                                {availableDogs.map(dog => (
                                                    <div 
                                                        key={dog} 
                                                        onClick={() => handleDogSelection(log._id, dog)}
                                                        className={`cursor-pointer px-2 py-1 rounded text-sm ${
                                                            selectedDogs[log._id]?.includes(dog) 
                                                                ? 'bg-blue-500 text-white' 
                                                                : 'bg-gray-200'
                                                        }`}
                                                    >
                                                        {dog}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div>{log.dogs?.join(", ") || "None"}</div>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        {user?.role === 'Marshall' && log.status === 'pending' ? (
                                            <textarea
                                                value={notes[log._id] || ''}
                                                onChange={(e) => handleNotesChange(log._id, e.target.value)}
                                                className="w-full p-2 border rounded"
                                                rows="2"
                                            />
                                        ) : (
                                            log.notes || "No notes"
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            log.status === 'completed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    {user?.role === 'Marshall' && (
                                        <td className="py-2 px-4 border">
                                            {log.status === 'pending' && (
                                                <button
                                                    onClick={() => handleSubmit(log._id)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                    disabled={!selectedDogs[log._id]?.length}
                                                >
                                                    Submit
                                                </button>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default WalkLog;