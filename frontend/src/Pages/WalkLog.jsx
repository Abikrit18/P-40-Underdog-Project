import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPrint, FaFilter, FaSearch, FaSort } from "react-icons/fa";
import formatTimeForDisplay from '../components/Calendar/formatTime';

const WalkLog = () => {
    const [user, setUser] = useState(null);
    const [walkLogs, setWalkLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDogs, setSelectedDogs] = useState({});
    const [availableDogs, setAvailableDogs] = useState([]);
    const printRef = useRef();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(15);
    const [totalPages, setTotalPages] = useState(0);
    
    // Filtering state
    const [dateFilter, setDateFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('all');
    
    // Sorting state
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');

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
    }, [token, sortOrder]);

    // Calculate total pages based on filtered logs length
    const calculateTotalPages = (logCount) => {
        setTotalPages(Math.ceil(logCount / recordsPerPage));
    };

    // Effect for re-filtering when filters change
    useEffect(() => {
        applyFilters();
    }, [dateFilter, searchTerm, searchField, walkLogs]);

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
                "Max"
            ]);
        }
    };

    const fetchWalkLogs = async (userId, role) => {
        try {
            setLoading(true);
            let response;
            
            if (role === 'admin') {
                response = await axios.get(`http://localhost:3000/walks/logs?sortOrder=${sortOrder}`);
            } else if (role === 'Marshall') {
                response = await axios.get(`http://localhost:3000/walks/logs/marshall/${userId}?sortOrder=${sortOrder}`);
            }
            
            const logs = response.data;
            setWalkLogs(logs);
            setFilteredLogs(logs);
            calculateTotalPages(logs.length);
            
            // Initialize selected dogs for each log
            const dogsObj = {};
            logs.forEach(log => {
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

    // Add sorting function
    const sortWalkLogs = (logs) => {
        return [...logs].sort((a, b) => {
            if (sortField === 'date') {
                const dateA = new Date(`${a.date} ${a.time}`);
                const dateB = new Date(`${b.date} ${b.time}`);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
            return 0;
        });
    };

    // Get records for current page
    const getCurrentPageRecords = () => {
        const indexOfLastRecord = currentPage * recordsPerPage;
        const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
        return filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);
    };

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle sort toggle
    const handleSort = (field) => {
        if (field === sortField) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('desc');
        }
    };

    // Apply filters based on date filter and search term
    const applyFilters = () => {
        let filtered = [...walkLogs];
        
        // Date filter
        if (dateFilter !== 'all') {
            const today = new Date();
            let startDate;
            
            switch(dateFilter) {
                case 'last7':
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'last14':
                    startDate = new Date();
                    startDate.setDate(today.getDate() - 14);
                    break;
                case 'lastMonth':
                    startDate = new Date();
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                filtered = filtered.filter(log => {
                    const logDate = new Date(log.date);
                    return logDate >= startDate && logDate <= today;
                });
            }
        }
        
        // Search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.trim().toLowerCase();
            
            filtered = filtered.filter(log => {
                try {
                    switch(searchField) {
                        case 'user':
                            return log.userId && 
                                typeof log.userId === 'object' && 
                                `${log.userId.firstName || ''} ${log.userId.lastName || ''}`
                                    .toLowerCase()
                                    .includes(term);
                                    
                        case 'marshall':
                            return log.marshallId && 
                                typeof log.marshallId === 'object' && 
                                `${log.marshallId.firstName || ''} ${log.marshallId.lastName || ''}`
                                    .toLowerCase()
                                    .includes(term);
                                    
                        case 'dogs':
                            // Handle different possible formats of dogs data
                            if (Array.isArray(log.dogs)) {
                                return log.dogs.some(dog => 
                                    (typeof dog === 'string' && dog.toLowerCase().includes(term)) ||
                                    (typeof dog === 'object' && dog.name && dog.name.toLowerCase().includes(term))
                                );
                            } else if (typeof log.dogs === 'string') {
                                return log.dogs.toLowerCase().includes(term);
                            }
                            return false;
                            
                        case 'status':
                            return log.status && log.status.toLowerCase().includes(term);
                            
                        default: // 'all' - search across all fields
                            // User name
                            const userName = log.userId && typeof log.userId === 'object' ? 
                                `${log.userId.firstName || ''} ${log.userId.lastName || ''}`.toLowerCase() : '';
                            
                            // Marshall name
                            const marshallName = log.marshallId && typeof log.marshallId === 'object' ? 
                                `${log.marshallId.firstName || ''} ${log.marshallId.lastName || ''}`.toLowerCase() : '';
                            
                            // Dogs check
                            let dogsMatch = false;
                            if (Array.isArray(log.dogs)) {
                                dogsMatch = log.dogs.some(dog => 
                                    (typeof dog === 'string' && dog.toLowerCase().includes(term)) ||
                                    (typeof dog === 'object' && dog.name && dog.name.toLowerCase().includes(term))
                                );
                            } else if (typeof log.dogs === 'string') {
                                dogsMatch = log.dogs.toLowerCase().includes(term);
                            }
                            
                            // Status check
                            const statusMatch = log.status && log.status.toLowerCase().includes(term);
                            
                            // Date check
                            const dateMatch = log.date && log.date.includes(term);
                            
                            // Time check
                            const timeMatch = log.time && log.time.toLowerCase().includes(term);
                            
                            return userName.includes(term) || 
                                marshallName.includes(term) || 
                                dogsMatch || 
                                statusMatch || 
                                dateMatch ||
                                timeMatch;
                    }
                } catch (error) {
                    console.error('Error in search filter:', error);
                    return false;
                }
            });
        }
        
        // Apply sorting before setting filtered logs
        const sortedLogs = sortWalkLogs(filtered);
        setFilteredLogs(sortedLogs);
        calculateTotalPages(sortedLogs.length);
        
        // Reset to first page when filters change
        setCurrentPage(1);
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
            const logResponse = await axios.put(`http://localhost:3000/walks/logs/${logId}`, {
                dogs: selectedDogs[logId],
                status: 'completed'
            });
            
            toast.success("Walk log updated successfully");
            
            // After completing a walk, restore the time slot for future bookings
            const completedLog = logResponse.data.walkLog;
            
            // Restore the time slot for the marshall to make it available again
            try {
                await axios.post('http://localhost:3000/walks/restore-available-time', {
                    marshallId: completedLog.marshallId,
                    date: completedLog.date,
                    time: completedLog.time
                });
                
                toast.info("Time slot is now available for future scheduling");
            } catch (restoreError) {
                console.error("Error restoring time slot:", restoreError);
                // This is non-critical, so we don't show an error toast
            }
            
            // Update local state to reflect changes
            setWalkLogs(prev => 
                prev.map(log => 
                    log._id === logId 
                        ? { 
                            ...log, 
                            dogs: selectedDogs[log._id], 
                            status: 'completed' 
                        } 
                        : log
                )
            );
            
            // Apply filters to ensure UI is updated
            applyFilters();
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
                    .incomplete {
                        color: red;
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
                        ${filteredLogs.map(log => `
                            <tr>
                                <td>${log.date}</td>
                                <td>${log.time}</td>
                                <td>${log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "Unknown"}</td>
                                <td>${log.marshallId ? `${log.marshallId.firstName} ${log.marshallId.lastName}` : "Unknown"}</td>
                                <td>${Array.isArray(log.dogs) ? log.dogs.join(", ") : "N/A"}</td>
                                <td class="${log.status === 'completed' ? 'completed' : log.status === 'incomplete' ? 'incomplete' : 'pending'}">${log.status}</td>
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
        }, 250);
    };

    if (loading) return <div className="text-center p-8">Loading walk logs...</div>;

    return (
        <div className="container mx-auto p-6">
            <ToastContainer />
            
            {/* Header with Title and Print Button */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Walk Logs</h1>
                {user?.role === 'admin' && (
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
                    >
                        <FaPrint /> Print Report
                    </button>
                )}
            </div>
            
            {/* Filters and Search Bar */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Filter</label>
                            <select 
                                className="border rounded px-3 py-2 text-sm w-full sm:w-auto"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            >
                                <option value="all">All Time</option>
                                <option value="last7">Last 7 Days</option>
                                <option value="last14">Last 14 Days</option>
                                <option value="lastMonth">Last Month</option>
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <button 
                                onClick={() => handleSort('date')}
                                className="flex items-center gap-1 border rounded px-3 py-2 text-sm hover:bg-gray-100"
                            >
                                <FaSort /> Sort by Date ({sortOrder === 'desc' ? 'Newest' : 'Oldest'})
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                        <div>
                            <select 
                                className="border rounded px-3 py-2 text-sm"
                                value={searchField}
                                onChange={(e) => setSearchField(e.target.value)}
                            >
                                <option value="all">All Fields</option>
                                <option value="user">User</option>
                                <option value="marshall">Marshall</option>
                                <option value="dogs">Dogs</option>
                                <option value="status">Status</option>
                            </select>
                        </div>
                        <div className="relative flex-grow">
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="border rounded pl-10 pr-3 py-2 w-full text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Pagination Info */}
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                <p>
                    Showing {filteredLogs.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0} 
                    to {Math.min(currentPage * recordsPerPage, filteredLogs.length)} 
                    of {filteredLogs.length} records
                </p>
                <p>
                    Page {filteredLogs.length > 0 ? currentPage : 0} of {totalPages}
                </p>
            </div>
            
            {/* Walk Logs Table */}
            {walkLogs.length === 0 ? (
                <div className="text-gray-500">No walk logs available.</div>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow-md" ref={printRef}>
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                    <div className="flex items-center">
                                        Date/Time
                                        {sortField === 'date' && (
                                            <span className="ml-1">
                                                {sortOrder === 'desc' ? '↓' : '↑'}
                                            </span>
                                        )}
                                    </div>
                                </th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Time</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Marshall</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Dogs</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                                {user?.role === 'Marshall' && (
                                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {getCurrentPageRecords().map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="py-4 px-4 text-sm">{log.date}</td>
                                    <td className="py-4 px-4 text-sm">{formatTimeForDisplay(log.time)}</td>
                                    <td className="py-4 px-4 text-sm">
                                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "Unknown"}
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        {log.marshallId ? `${log.marshallId.firstName} ${log.marshallId.lastName}` : "Unknown"}
                                    </td>
                                    <td className="py-4 px-4 text-sm">
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
                                            <div>{Array.isArray(log.dogs) ? log.dogs.join(", ") : "N/A"}</div>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            log.status === 'completed' 
                                                ? 'bg-green-100 text-green-800' 
                                                : log.status === 'incomplete'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    {user?.role === 'Marshall' && (
                                        <td className="py-4 px-4 text-sm">
                                            {log.status === 'pending' && (
                                                <button
                                                    onClick={() => handleSubmit(log._id)}
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="flex items-center">
                        <button 
                            onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 rounded-l bg-white border border-r-0 border-gray-300 text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        
                        {Array.from({ length: totalPages }).map((_, index) => {
                            // Show limited page buttons for better UI
                            if (
                                index === 0 || 
                                index === totalPages - 1 || 
                                (index >= currentPage - 2 && index <= currentPage + 2)
                            ) {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => paginate(index + 1)}
                                        className={`px-3 py-1 border border-gray-300 text-sm ${
                                            currentPage === index + 1 
                                                ? 'bg-blue-500 text-white' 
                                                : 'bg-white'
                                        }`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            } else if (
                                (index === currentPage - 3 && currentPage > 3) || 
                                (index === currentPage + 3 && currentPage < totalPages - 3)
                            ) {
                                return <span key={index} className="px-2 py-1">...</span>;
                            }
                            return null;
                        })}
                        
                        <button 
                            onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 rounded-r bg-white border border-l-0 border-gray-300 text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default WalkLog;