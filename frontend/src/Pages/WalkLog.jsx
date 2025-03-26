import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPrint } from "react-icons/fa"; 

const WalkLog = () => {
    const [user, setUser] = useState(null);
    const [walkLogs, setWalkLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDogs, setSelectedDogs] = useState({});
    const [availableDogs, setAvailableDogs] = useState([]);
    const printRef = useRef();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
                fetchWalkLogs(decodedToken.id, decodedToken.role);
                fetchDogs();
            } catch (error) {
                console.error("Failed to decode token:", error);
                toast.error("Authentication error. Please login again.");
            }
        }
    }, [token]);

    const fetchDogs = async () => {
        try {
            // Fetch dogs data
            const response = await axios.get("http://localhost:3000/dogs");  
            // Extract just the dog names from the dog objects
            const dogNames = response.data.map(dog => dog.name);
            setAvailableDogs(dogNames);
        } catch (error) {
            console.error("Error fetching dogs:", error);
            toast.error("Failed to fetch dogs");
            
            // Fallback to hardcoded dogs if fetching fails
            setAvailableDogs([
                "Max", "Bella", "Charlie", "Lucy", "Cooper", "Luna", 
                "Buddy", "Daisy", "Rocky", "Sadie", "Milo", "Bailey"
            ]);
        }
    };

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
            
            // Initialize selected dogs for each log
            const dogsObj = {};
            response.data.forEach(log => {
                dogsObj[log._id] = log.dogs || [];
            });
            
            setSelectedDogs(dogsObj);
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

    const handleSubmit = async (logId) => {
        try {
            await axios.put(`http://localhost:3000/walks/logs/${logId}`, {
                dogs: selectedDogs[logId],
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

    // Function to handle printing the report
    const handlePrint = () => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'height=600,width=800');
        
        // Generate the content to print - we'll create a simplified version of the table
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Walk Logs Report</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 20px;
                    }
                    h1 {
                        color: #333;
                        text-align: center;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: left;
                    }
                    th {
                        background-color: #f2f2f2;
                    }
                    .completed {
                        color: green;
                        font-weight: bold;
                    }
                    .pending {
                        color: orange;
                        font-weight: bold;
                    }
                    .print-date {
                        text-align: right;
                        margin-bottom: 20px;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <h1>Underdog Project - Walk Logs Report</h1>
                <div class="print-date">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>User</th>
                            <th>Marshall</th>
                            <th>Dogs</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${walkLogs.map(log => `
                            <tr>
                                <td>${log.date}</td>
                                <td>${log.time}</td>
                                <td>${log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "Unknown"}</td>
                                <td>${log.marshallId ? `${log.marshallId.firstName} ${log.marshallId.lastName}` : "Unknown"}</td>
                                <td>${Array.isArray(log.dogs) ? log.dogs.join(", ") : "None"}</td>
                                <td class="${log.status === 'completed' ? 'completed' : 'pending'}">${log.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        
        // Trigger print dialog
        printWindow.document.close();
        printWindow.focus();
        // Wait a moment for content to load before printing
        setTimeout(() => {
            printWindow.print();
            // Close the print window after printing (optional)
            // printWindow.close();
        }, 250);
    };

    if (loading) return <div className="text-center p-8">Loading walk logs...</div>;

    return (
        <div className="container mx-auto p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Walk Logs</h1>
                {user?.role === 'admin' && (
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        <FaPrint /> Print Report
                    </button>
                )}
            </div>
            
            {walkLogs.length === 0 ? (
                <div className="text-gray-500">No walk logs available.</div>
            ) : (
                <div className="overflow-x-auto" ref={printRef}>
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border">Date</th>
                                <th className="py-2 px-4 border">Time</th>
                                <th className="py-2 px-4 border">User</th>
                                <th className="py-2 px-4 border">Marshall</th>
                                <th className="py-2 px-4 border">Dogs</th>
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
                                            <div>{Array.isArray(log.dogs) ? log.dogs.join(", ") : "None"}</div>
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