import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaPrint, FaSearch, FaFilter, FaCalendarAlt,FaAngleLeft, FaAngleRight, FaSort } from "react-icons/fa"; 

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
    const [totalPages, setTotalPages] = useState(1);
    const recordsPerPage = 15;
    
    // Filter and search state
    const [dateFilter, setDateFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchParam, setSearchParam] = useState('all');

    // Add new state for sorting
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for most recent first
    const [sortField, setSortField] = useState('date'); // default sort by date

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
            const response = await axios.get("https://p-40-underdog-project-backend.onrender.com/dogs");  
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

    // Modified fetchWalkLogs to store original data
    const fetchWalkLogs = async (userId, role) => {
        try {
            setLoading(true);
            let response;
            
            // Add sortOrder to the API requests
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
                return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
            }
            return 0;
        });
    };

    // Apply filters and search
    useEffect(() => {
        let result = [...walkLogs];
        
        // Apply date filter
        if (dateFilter !== 'all') {
            const today = new Date();
            let compareDate = new Date();
            
            switch(dateFilter) {
                case 'Today':
                    compareDate.setDate(today.getDate());
                    break;
                case 'Yesterday':
                    compareDate.setDate(today.getDate() - 1);
                    break;    
                case '7days':
                    compareDate.setDate(today.getDate() - 7);
                    break;
                case '14days':
                    compareDate.setDate(today.getDate() - 14);
                    break;
                case '1month':
                    compareDate.setMonth(today.getMonth() - 1);
                    break;
                case '3months':
                    compareDate.setMonth(today.getMonth() - 3);
                    break;
                case '6months':
                    compareDate.setMonth(today.getMonth() - 6);
                    break;
                case '1year':
                    compareDate.setFullYear(today.getFullYear() - 1);
                    break;
                default:
                    break;
            }
            
            result = result.filter(log => {
                try {
                    const logDate = new Date(log.date);
                    return logDate >= compareDate;
                } catch (error) {
                    console.error("Invalid date format:", log.date);
                    return false;
                }
            });
        }
        
        // Apply search with better error handling
        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase().trim();
            
            result = result.filter(log => {
                try {
                    switch(searchParam) {
                        case 'user':
                            return log.userId && typeof log.userId === 'object' && 
                                `${log.userId.firstName || ''} ${log.userId.lastName || ''}`
                                    .toLowerCase()
                                    .includes(term);
                                    
                        case 'marshall':
                            return log.marshallId && typeof log.marshallId === 'object' && 
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
                    console.error("Error during search filtering:", error);
                    return false; // Skip items that cause errors
                }
            });
        }
        
        // Sort the filtered results
        result = [...result].sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        
        setFilteredLogs(result);
        calculateTotalPages(result.length);
        setCurrentPage(1); // Reset to first page when filters change
    }, [walkLogs, dateFilter, searchTerm, searchParam, sortOrder]);

    const calculateTotalPages = (recordCount) => {
        setTotalPages(Math.ceil(recordCount / recordsPerPage));
    };

    // Get current page records
    const getCurrentPageRecords = () => {
        const indexOfLastRecord = currentPage * recordsPerPage;
        const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
        return filteredLogs.slice(indexOfFirstRecord, indexOfLastRecord);
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
            await axios.put(`https://p-40-underdog-project-backend.onrender.com/walks/logs/${logId}`, {
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
                            dogs: selectedDogs[log._id], 
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
                        ${walkLogs.map(log => `
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
            // Close the print window after printing (optional)
            // printWindow.close();
        }, 250);
    };

    // Pagination handlers
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Date filter handler
    const handleDateFilter = (filter) => {
        setDateFilter(filter);
    };

    // Search handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchParamChange = (e) => {
        setSearchParam(e.target.value);
    };

    // Add sorting handler
    const handleSortChange = (e) => {
        setSortOrder(e.target.value);
        if (user) {
            fetchWalkLogs(user.id, user.role);
        }
    };

    // First, let's define the default sort order as a constant
    const DEFAULT_SORT_ORDER = 'desc';

    // Modify the reset button click handler
    const handleReset = () => {
        if (!user) return;
        
        setDateFilter('all');
        setSearchTerm('');
        setSearchParam('all');
        setSortOrder(DEFAULT_SORT_ORDER);
        // Re-fetch the walk logs with the current user's credentials
        fetchWalkLogs(user.id, user.role);
    };

    if (loading) return <div className="text-center p-8">Loading walk logs...</div>;

    return (
        <div className="container mx-auto p-6">
            <ToastContainer />
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold mb-4 md:mb-0">Walk Logs</h1>
                
                <div className="flex flex-wrap gap-2">
                    {user?.role === 'admin' && (
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                        >
                            <FaPrint /> Print Report
                        </button>
                    )}
                </div>
            </div>
            
            {/* Filters and Search Section - Now with blue background */}
            <div className="bg-blue-50 rounded-lg shadow-md p-4 mb-6 border border-blue-100">
                <h3 className="text-blue-800 font-medium mb-3 flex items-center">
                    <FaFilter className="inline mr-2" /> Filter & Sort
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Date Filter Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            <FaCalendarAlt className="inline mr-2" /> Date Range
                        </label>
                        <select 
                            value={dateFilter} 
                            onChange={(e) => handleDateFilter(e.target.value)}
                            className="block w-full p-2 bg-white border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Time</option>
                            <option value="Today">Today</option>
                            <option value="Yesterday">Yesterday</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="14days">Last 14 Days</option>
                            <option value="1month">Last Month</option>
                            <option value="3months">Last 3 Months</option>
                            <option value="6months">Last 6 Months</option>
                            <option value="1year">Last Year</option>
                        </select>
                    </div>
                    
                    {/* Search Parameter Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            <FaFilter className="inline mr-2" /> Search By
                        </label>
                        <select 
                            value={searchParam} 
                            onChange={handleSearchParamChange}
                            className="block w-full p-2 bg-white border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Fields</option>
                            <option value="user">User</option>
                            <option value="marshall">Marshall</option>
                            <option value="dogs">Dogs</option>
                            <option value="status">Status</option>
                        </select>
                    </div>
                    
                    {/* Search Input */}
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            <FaSearch className="inline mr-2" /> Search
                        </label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={handleSearchChange}
                                placeholder="Search walk logs..."
                                className="block w-full p-2 pl-10 bg-white border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                
                            </div>
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* New Sort Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-blue-700 mb-2">
                            <FaSort className="inline mr-2" /> Sort by Time
                        </label>
                        <select 
                            value={sortOrder}
                            onChange={handleSortChange}
                            className="block w-full p-2 bg-white border border-blue-200 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="desc">Most Recent First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>
                
                {/* Filter Stats & Reset Button */}
                <div className="flex justify-between items-center mt-4 text-sm">
                    <div className="text-blue-700">
                        <span>
                            {dateFilter !== 'all' && (
                                <span className="mr-2">
                                    <span className="font-medium">Date:</span> {dateFilter === 'Today' ? 'Today' : 
                                                                         dateFilter === 'Yesterday' ? 'Yesterday' :
                                                                         dateFilter === '7days' ? 'Last 7 Days' :
                                                                         dateFilter === '14days' ? 'Last 14 Days' : 
                                                                         dateFilter === '1month' ? 'Last Month' :
                                                                         dateFilter === '3months' ? 'Last 3 Months' :
                                                                         dateFilter === '6months' ? 'Last 6 Months' :
                                                                         dateFilter === '1year' ? 'Last Year' : 'All Time'}
                                </span>
                            )}
                            {searchTerm && (
                                <span>
                                    <span className="font-medium">Search:</span> "{searchTerm}" in {searchParam === 'all' ? 'All Fields' : 
                                                                                        searchParam === 'user' ? 'User' :
                                                                                        searchParam === 'marshall' ? 'Marshall' :
                                                                                        searchParam === 'dogs' ? 'Dogs' : 'Status'}
                                </span>
                            )}
                            {sortOrder && (
                                <span className="ml-2">
                                    <span className="font-medium">Sort:</span> {
                                        sortOrder === 'desc' ? 'Most Recent First' : 'Oldest First'
                                    }
                                </span>
                            )}
                        </span>
                    </div>
                    
                    {/* Always show the reset button */}
                    <button 
                        onClick={handleReset} 
                        className={`text-blue-600 hover:text-blue-800 font-medium ${
                            // Add visual indication when filters are active
                            (dateFilter !== 'all' || searchTerm || sortOrder !== DEFAULT_SORT_ORDER)
                                ? 'opacity-100'
                                : 'opacity-50'
                        }`}
                    >
                        Reset All
                    </button>
                </div>
            </div>
            
            {/* Results Info - Improved to show exact range */}
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600">
                    {filteredLogs.length === 0 ? (
                        "No records found"
                    ) : (
                        <>
                            Showing {Math.min((currentPage - 1) * recordsPerPage + 1, filteredLogs.length)}-
                            {Math.min(currentPage * recordsPerPage, filteredLogs.length)} of {filteredLogs.length} 
                            {filteredLogs.length === 1 ? ' record' : ' records'}
                        </>
                    )}
                </p>
                
                <p className="text-gray-500 text-sm">
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
                                    <td className="py-4 px-4 text-sm">{log.time}</td>
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
                                                    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
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
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                    <nav className="flex items-center">
                        <button 
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded flex items-center mr-1 ${
                                currentPage === 1 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                            title="First Page"
                        >
                            <FaAngleLeft className="mr-1" />
                            <FaAngleLeft className="-ml-2" />
                        </button>
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 rounded flex items-center justify-center mr-2 ${
                                currentPage === 1 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                            title="Previous Page"
                        >
                            <FaAngleLeft />
                        </button>
                        
                        {/* Page numbers with ellipsis for large page counts */}
                        <div className="flex space-x-1">
                            {totalPages <= 7 ? (
                                // Show all page numbers if 7 or fewer
                                [...Array(totalPages).keys()].map(number => (
                                    <button
                                        key={number + 1}
                                        onClick={() => handlePageChange(number + 1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded ${
                                            currentPage === number + 1
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                    >
                                        {number + 1}
                                    </button>
                                ))
                            ) : (
                                // Show limited page numbers with ellipsis for large page counts
                                <>
                                    {/* First page always shown */}
                                    <button
                                        onClick={() => handlePageChange(1)}
                                        className={`w-8 h-8 flex items-center justify-center rounded ${
                                            currentPage === 1
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                    >
                                        1
                                    </button>

                                    {/* Show ellipsis if not on first few pages */}
                                    {currentPage > 3 && <span className="px-2">...</span>}

                                    {/* Show current page and neighbors */}
                                    {[...Array(5)].map((_, idx) => {
                                        const pageNumber = Math.min(
                                            Math.max(currentPage - 2 + idx, 2),
                                            totalPages - 1
                                        );
                                        
                                        // Skip rendering if outside the valid range or if would overlap with first/last pages
                                        if (pageNumber <= 1 || pageNumber >= totalPages) return null;
                                        
                                        // Skip rendering if too far from current page
                                        if (Math.abs(currentPage - pageNumber) > 2 && totalPages > 7) return null;
                                        
                                        return (
                                            <button
                                                key={pageNumber}
                                                onClick={() => handlePageChange(pageNumber)}
                                                className={`w-8 h-8 flex items-center justify-center rounded ${
                                                    currentPage === pageNumber
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-200 hover:bg-gray-300'
                                                }`}
                                            >
                                                {pageNumber}
                                            </button>
                                        );
                                    })}

                                    {/* Show ellipsis if not on last few pages */}
                                    {currentPage < totalPages - 2 && <span className="px-2">...</span>}

                                    {/* Last page always shown */}
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        className={`w-8 h-8 flex items-center justify-center rounded ${
                                            currentPage === totalPages
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 hover:bg-gray-300'
                                        }`}
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded flex items-center justify-center ml-2 ${
                                currentPage === totalPages
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                            title="Next Page"
                        >
                            <FaAngleRight />
                        </button>
                        <button 
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 rounded flex items-center ml-1 ${
                                currentPage === totalPages
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                            title="Last Page"
                        >
                            <FaAngleRight className="mr-1" />
                            <FaAngleRight className="-ml-2" />
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default WalkLog;
