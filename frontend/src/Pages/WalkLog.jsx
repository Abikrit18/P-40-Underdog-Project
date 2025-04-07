import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaPrint, FaFilter, FaSearch, FaSort, FaCalendarAlt,
  FaUser, FaWalking, FaDog, FaCheck, FaTimes, FaClipboardList
} from "react-icons/fa";
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
        // [Your existing filter logic - unchanged]
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

            // After completing a walk, restore the time slot for future bookings (if not fully booked)
            const completedLog = logResponse.data.walkLog;

            // Restore the time slot for the marshall to make it available again
            try {
                const restoreResponse = await axios.post('http://localhost:3000/walks/restore-available-time', {
                    marshallId: completedLog.marshallId,
                    date: completedLog.date,
                    time: completedLog.time,
                    isTimeSlotFullyBooked: completedLog.isTimeSlotFullyBooked
                });

                if (restoreResponse.data.wasRestored) {
                    toast.info("Time slot is now available for future scheduling");
                } else {
                    toast.info("This time slot has reached maximum capacity and is no longer available");
                }
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600">Loading walk logs...</p>
            </div>
        </div>
    );

    // Stats calculation for summary cards
    const completedWalks = filteredLogs.filter(log => log.status === 'completed').length;
    const pendingWalks = filteredLogs.filter(log => log.status === 'pending').length;
    const incompleteWalks = filteredLogs.filter(log => log.status === 'incomplete').length;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <ToastContainer />

                {/* Header with Title and Print Button */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <FaClipboardList className="text-blue-600 text-3xl mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">Walk Logs</h1>
                        </div>
                        {user?.role === 'admin' && (
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow transition-colors duration-200"
                            >
                                <FaPrint /> Print Report
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center transition-transform hover:scale-[1.02] duration-300">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <FaCheck className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed Walks</p>
                            <p className="text-2xl font-bold text-green-600">{completedWalks}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center transition-transform hover:scale-[1.02] duration-300">
                        <div className="rounded-full bg-yellow-100 p-3 mr-4">
                            <FaWalking className="text-yellow-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Walks</p>
                            <p className="text-2xl font-bold text-yellow-600">{pendingWalks}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center transition-transform hover:scale-[1.02] duration-300">
                        <div className="rounded-full bg-red-100 p-3 mr-4">
                            <FaTimes className="text-red-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Incomplete Walks</p>
                            <p className="text-2xl font-bold text-red-600">{incompleteWalks}</p>
                        </div>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                        <FaFilter className="mr-2 text-blue-500" /> Filters and Search
                    </h2>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute right-4 top-3 text-gray-400" />
                                    <select
                                        className="pl-10 p-2 border rounded-lg text-sm bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="last7">Last 7 Days</option>
                                        <option value="last14">Last 14 Days</option>
                                        <option value="lastMonth">Last Month</option>
                                    </select>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                                <button
                                    onClick={() => handleSort('date')}
                                    className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm bg-gray-50 shadow-sm hover:bg-gray-100 transition-colors w-full justify-center"
                                >
                                    <FaSort /> {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Field</label>
                                <select
                                    className="p-2 border rounded-lg text-sm bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full"
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
                            <div className="w-full sm:w-auto">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Search Term</label>
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-10 pr-4 py-2 border rounded-lg text-sm bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full text-center"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-700">Walk Records</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Showing {filteredLogs.length > 0 ? (currentPage - 1) * recordsPerPage + 1 : 0}
                            to {Math.min(currentPage * recordsPerPage, filteredLogs.length)}
                            of {filteredLogs.length} records
                        </p>
                    </div>

                    {/* Walk Logs Table */}
                    {walkLogs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FaClipboardList className="text-gray-300 text-5xl mb-4" />
                            <p className="text-gray-500 text-lg">No walk logs available.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto" ref={printRef}>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center cursor-pointer" onClick={() => handleSort('date')}>
                                                <FaCalendarAlt className="mr-1 text-gray-400" />
                                                Date
                                                {sortField === 'date' && (
                                                    <span className="ml-1 text-blue-500">
                                                        {sortOrder === 'desc' ? '↓' : '↑'}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <FaUser className="mr-1 text-gray-400" />
                                                User
                                            </div>
                                        </th>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <FaWalking className="mr-1 text-gray-400" />
                                                Marshall
                                            </div>
                                        </th>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <div className="flex items-center">
                                                <FaDog className="mr-1 text-gray-400" />
                                                Dogs
                                            </div>
                                        </th>
                                        <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        {user?.role === 'Marshall' && (
                                            <th className="py-3.5 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getCurrentPageRecords().map((log) => (
                                        <tr key={log._id} className="hover:bg-blue-50 transition-colors">
                                            <td className="py-4 px-4 text-sm font-medium text-gray-900">{log.date}</td>
                                            <td className="py-4 px-4 text-sm text-gray-700">{formatTimeForDisplay(log.time)}</td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                                        <FaUser className="text-xs" />
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "Unknown"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
                                                        <FaWalking className="text-xs" />
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {log.marshallId ? `${log.marshallId.firstName} ${log.marshallId.lastName}` : "Unknown"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-sm">
                                                {user?.role === 'Marshall' && log.status === 'pending' ? (
                                                    <div className="flex flex-wrap gap-2 max-w-xs">
                                                        {availableDogs.map(dog => (
                                                            <div
                                                                key={dog}
                                                                onClick={() => handleDogSelection(log._id, dog)}
                                                                className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                                    selectedDogs[log._id]?.includes(dog)
                                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                            >
                                                                {dog}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                        {Array.isArray(log.dogs) && log.dogs.length > 0 ? (
                                                            log.dogs.map((dog, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <FaDog className="mr-1 text-xs" />
                                                                    {dog}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-500">No dogs selected</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-sm">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center ${
                                                    log.status === 'completed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : log.status === 'incomplete'
                                                        ? 'bg-red-100 text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {log.status === 'completed' && <FaCheck className="mr-1" />}
                                                    {log.status === 'incomplete' && <FaTimes className="mr-1" />}
                                                    {log.status === 'pending' && <FaWalking className="mr-1" />}
                                                    {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                                                </span>
                                            </td>
                                            {user?.role === 'Marshall' && (
                                                <td className="py-4 px-4 text-sm">
                                                    {log.status === 'pending' && (
                                                        <button
                                                            onClick={() => handleSubmit(log._id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                                            disabled={!selectedDogs[log._id]?.length}
                                                        >
                                                            <FaCheck className="text-xs" />
                                                            Complete Walk
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
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <p className="text-sm text-gray-500">
                                    Page {filteredLogs.length > 0 ? currentPage : 0} of {totalPages}
                                </p>

                                <nav className="flex items-center space-x-1">
                                    <button
                                        onClick={() => paginate(1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        First
                                    </button>

                                    <button
                                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Prev
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
                                                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${
                                                        currentPage === index + 1
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white border border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            );
                                        } else if (
                                            (index === currentPage - 3 && currentPage > 3) ||
                                            (index === currentPage + 3 && currentPage < totalPages - 3)
                                        ) {
                                            return <span key={index} className="px-1 py-1 text-gray-500">...</span>;
                                        }
                                        return null;
                                    })}

                                    <button
                                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Next
                                    </button>

                                    <button
                                        onClick={() => paginate(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 rounded bg-white border border-gray-300 text-sm disabled:opacity-50 hover:bg-gray-50"
                                    >
                                        Last
                                    </button>
                                </nav>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalkLog;