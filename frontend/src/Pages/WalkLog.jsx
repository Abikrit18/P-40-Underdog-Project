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
    const [showDogModal, setShowDogModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [currentLogId, setCurrentLogId] = useState(null);
    const [confirmLogDetails, setConfirmLogDetails] = useState(null);
    const printRef = useRef();

    console.log(availableDogs)

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
            const response = await axios.get("https://p-40-underdog-project-backend.onrender.com/dogs");
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
                response = await axios.get(`https://p-40-underdog-project-backend.onrender.com/walks/logs?sortOrder=${sortOrder}`);
            } else if (role === 'Marshall') {
                response = await axios.get(`https://p-40-underdog-project-backend.onrender.com/walks/logs/marshall/${userId}?sortOrder=${sortOrder}`);
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

    const handleSelectDogModal = (logId) => {
        setCurrentLogId(logId);
        setShowDogModal(true);
    };

    const handleCloseModal = () => {
        setShowDogModal(false);
        setCurrentLogId(null);
    };

    const handleSaveDogSelection = async () => {
        if (!currentLogId || !selectedDogs[currentLogId] || selectedDogs[currentLogId].length === 0) {
            toast.error("Please select at least one dog");
            return;
        }

        try {
            await axios.put(`https://p-40-underdog-project-backend.onrender.com/walks/logs/${currentLogId}`, {
                dogs: selectedDogs[currentLogId]
            });

            toast.success("Dogs updated successfully");

            // Update local state to reflect changes
            setWalkLogs(prev =>
                prev.map(log =>
                    log._id === currentLogId
                        ? {
                            ...log,
                            dogs: selectedDogs[currentLogId]
                        }
                        : log
                )
            );

            // Apply filters to ensure UI is updated
            applyFilters();

            // Close the modal
            handleCloseModal();
        } catch (error) {
            console.error("Error updating dogs:", error);
            toast.error("Failed to update dogs");
        }
    };

    const handleSubmit = (logId) => {
        // Check if dogs are selected
        if (!selectedDogs[logId] || selectedDogs[logId].length === 0) {
            toast.error("Please select at least one dog before completing the walk");
            return;
        }

        // Find the log details for confirmation
        const logToComplete = walkLogs.find(log => log._id === logId);
        if (!logToComplete) {
            toast.error("Could not find walk details");
            return;
        }

        // Set confirmation details and show modal
        setConfirmLogDetails({
            id: logId,
            date: logToComplete.date,
            time: logToComplete.time,
            user: logToComplete.userId ? `${logToComplete.userId.firstName} ${logToComplete.userId.lastName}` : "Unknown",
            dogs: selectedDogs[logId]
        });
        setShowConfirmModal(true);
    };

    const handleConfirmComplete = async () => {
        if (!confirmLogDetails) return;

        try {
            const logResponse = await axios.put(`https://p-40-underdog-project-backend.onrender.com/walks/logs/${confirmLogDetails.id}`, {
                dogs: confirmLogDetails.dogs,
                status: 'completed'
            });

            toast.success("Walk log updated successfully");

            // After completing a walk, restore the time slot for future bookings (if not fully booked)
            const completedLog = logResponse.data.walkLog;

            // Restore the time slot for the marshall to make it available again
            try {
                const restoreResponse = await axios.post('https://p-40-underdog-project-backend.onrender.com/walks/restore-available-time', {
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
                    log._id === confirmLogDetails.id
                        ? {
                            ...log,
                            dogs: confirmLogDetails.dogs,
                            status: 'completed'
                        }
                        : log
                )
            );

            // Apply filters to ensure UI is updated
            applyFilters();

            // Close the confirmation modal
            setShowConfirmModal(false);
            setConfirmLogDetails(null);
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

    // Calculate walks without dogs for admin notification
    const walksWithoutDogs = user?.role === 'admin' ?
        filteredLogs.filter(log =>
            log.status === 'completed' &&
            (!log.dogs || log.dogs.length === 0)
        ).length : 0;

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

                {/* Marshall Guide */}
                {user?.role === 'Marshall' && pendingWalks > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 mb-8">
                        <div className="flex items-start">
                            <div className="bg-indigo-100 rounded-full p-2 mr-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-indigo-800 mb-2">Complete Your Walks</h2>
                                <p className="text-indigo-700 mb-3">You have {pendingWalks} pending {pendingWalks === 1 ? 'walk' : 'walks'} to complete. Please follow these steps:</p>
                                <ol className="list-decimal list-inside space-y-2 text-indigo-700 ml-2">
                                    <li>Find your pending walk in the table below</li>
                                    <li>Select the dog(s) that were walked by clicking on their names</li>
                                    <li>Click the <span className="font-medium">"Complete Walk"</span> button to record the walk</li>
                                </ol>
                                <div className="mt-4 p-3 bg-white rounded-md border border-indigo-200">
                                    <div className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <span className="text-sm font-medium text-gray-700">Important: You must select at least one dog before completing a walk.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Alert for Walks Without Dogs */}
                {user?.role === 'admin' && walksWithoutDogs > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-md shadow-sm">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Attention Required</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>There {walksWithoutDogs === 1 ? 'is' : 'are'} <strong>{walksWithoutDogs}</strong> completed {walksWithoutDogs === 1 ? 'walk' : 'walks'} without any dogs selected. Please update these records.</p>
                                </div>
                                <div className="mt-3">
                                    <button
                                        onClick={() => {
                                            setSearchField('dogs');
                                            setSearchTerm('No dogs');
                                        }}
                                        className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                                    >
                                        View affected walks
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center transition-transform hover:scale-[1.02] duration-300 relative">
                        {user?.role === 'admin' && walksWithoutDogs > 0 && (
                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                {walksWithoutDogs}
                            </div>
                        )}
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <FaCheck className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Completed Walks</p>
                            <p className="text-2xl font-bold text-green-600">{completedWalks}</p>
                            {user?.role === 'admin' && walksWithoutDogs > 0 && (
                                <p className="text-xs text-red-500 mt-1">{walksWithoutDogs} without dogs</p>
                            )}
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
                                                    <div>
                                                        <div className="mb-2">
                                                            <span className="text-sm font-medium text-indigo-700 block mb-1">Select dog(s) for this walk:</span>
                                                            {(!selectedDogs[log._id] || selectedDogs[log._id].length === 0) && (
                                                                <span className="text-xs text-red-500 block">* Required before completing walk</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 max-w-xs bg-gray-50 p-2 rounded-md border border-gray-200">
                                                            {availableDogs.map(dog => (
                                                                <div
                                                                    key={dog}
                                                                    onClick={() => handleDogSelection(log._id, dog)}
                                                                    className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                                        selectedDogs[log._id]?.includes(dog)
                                                                            ? 'bg-indigo-600 text-white shadow-sm'
                                                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                                    }`}
                                                                >
                                                                    <FaDog className="inline-block mr-1 text-xs" />
                                                                    {dog}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {selectedDogs[log._id]?.length > 0 && (
                                                            <div className="mt-2 text-xs text-green-600 flex items-center">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                {selectedDogs[log._id].length} dog(s) selected
                                                            </div>
                                                        )}
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
                                                            <div>
                                                                {log.status === 'completed' ? (
                                                                    <div className="flex items-center">
                                                                        <span className="text-red-500 font-medium">No dogs selected</span>
                                                                        {user?.role === 'Marshall' && (
                                                                            <button
                                                                                onClick={() => handleSelectDogModal(log._id)}
                                                                                className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200 transition-colors"
                                                                            >
                                                                                Select Dog
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-gray-500">No dogs selected</span>
                                                                )}
                                                            </div>
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
                                                        <div>
                                                            <button
                                                                onClick={() => handleSubmit(log._id)}
                                                                className={`px-4 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-1 w-full justify-center ${!selectedDogs[log._id]?.length
                                                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow'}`}
                                                                disabled={!selectedDogs[log._id]?.length}
                                                            >
                                                                {!selectedDogs[log._id]?.length ? (
                                                                    <>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                        Select Dog First
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaCheck className="text-xs" />
                                                                        Complete Walk
                                                                    </>
                                                                )}
                                                            </button>

                                                            {!selectedDogs[log._id]?.length && (
                                                                <div className="mt-2 text-xs text-center text-red-500">
                                                                    Please select at least one dog
                                                                </div>
                                                            )}
                                                        </div>
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

            {/* Dog Selection Modal */}
            {showDogModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Select Dogs for Walk</h2>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Select one or more dogs that were walked:</p>
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-md">
                                {availableDogs.map(dog => (
                                    <div
                                        key={dog}
                                        onClick={() => handleDogSelection(currentLogId, dog)}
                                        className={`cursor-pointer px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            selectedDogs[currentLogId]?.includes(dog)
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        <FaDog className="inline-block mr-1 text-xs" />
                                        {dog}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDogSelection}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                disabled={!currentLogId || !selectedDogs[currentLogId] || selectedDogs[currentLogId].length === 0}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmLogDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Confirm Walk Completion</h2>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 bg-green-50 p-4 rounded-md border border-green-100">
                            <h3 className="text-lg font-medium text-green-800 mb-2">Walk Details</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex">
                                    <span className="text-gray-600 w-24">Date:</span>
                                    <span className="font-medium text-gray-800">{confirmLogDetails.date}</span>
                                </li>
                                <li className="flex">
                                    <span className="text-gray-600 w-24">Time:</span>
                                    <span className="font-medium text-gray-800">{formatTimeForDisplay(confirmLogDetails.time)}</span>
                                </li>
                                <li className="flex">
                                    <span className="text-gray-600 w-24">User:</span>
                                    <span className="font-medium text-gray-800">{confirmLogDetails.user}</span>
                                </li>
                                <li>
                                    <span className="text-gray-600 block mb-1">Dogs:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {confirmLogDetails.dogs.map((dog, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <FaDog className="mr-1 text-xs" />
                                                {dog}
                                            </span>
                                        ))}
                                    </div>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-100 mb-6">
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-sm text-yellow-700">Please confirm that this walk has been completed with the selected dog(s). This action cannot be undone.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                            >
                                <FaCheck className="mr-2" />
                                Complete Walk
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalkLog;