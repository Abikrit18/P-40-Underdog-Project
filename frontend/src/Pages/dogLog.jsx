import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
// You might need to install these packages if not already installed
// npm install react-icons chart.js react-chartjs-2
import { FaDog, FaWalking, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const DogLog = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [dateFilter, setDateFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {

    setIsLoading(true);
    try {
    const response = await axios.get("https://p-40-underdog-project-backend.onrender.com/walks/logs?sortOrder=desc");
        const walkLogs = response.data;

        const dogStats = {};

        // Since logs are sorted by date descending, the first occurrence will be the latest
        walkLogs.forEach(log => {
            if (log.status !== 'completed') return;
            const walkDate = log.date;

                (log.dogs || []).forEach(dog => {
                    if (!dogStats[dog]) {
                        dogStats[dog] = {
                            _id: dog,
                            totalWalks: 1,
                            lastWalked: walkDate  // First occurrence = most recent
                        };
                    } else {
                        dogStats[dog].totalWalks += 1;
                        // Do NOT update lastWalked again
                    }
                });
        });

        const statsArray = Object.values(dogStats);
        setLogs(statsArray);
        setFilteredLogs(statsArray);
    } catch (error) {
        console.error("Error fetching walk logs", error);
    } finally {
        setIsLoading(false);
    }
};

    useEffect(() => {
        fetchLogs();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [dateFilter, logs, searchTerm]);

    const applyFilters = () => {
        let filtered = logs;
 
        if (dateFilter !== "all") {
            const today = new Date();
            let fromDate = new Date();
 
            if (dateFilter === "last7") fromDate.setDate(today.getDate() - 7);
            if (dateFilter === "last14") fromDate.setDate(today.getDate() - 14);
            if (dateFilter === "lastMonth") fromDate.setMonth(today.getMonth() - 1);
 
            filtered = logs.filter(log => {
                const lastWalkedDate = new Date(log.lastWalked);
                return lastWalkedDate >= fromDate && lastWalkedDate <= today;
            });
        }
 
        if (searchTerm.trim()) {
            filtered = filtered.filter(log =>
                log._id.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
 
        setFilteredLogs(filtered);
    };

    // Prepare chart data
    const chartData = {
        labels: filteredLogs.slice(0, 10).map(log => log._id),
        datasets: [
            {
                label: 'Number of Walks',
                data: filteredLogs.slice(0, 10).map(log => log.totalWalks),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Top 10 Dogs by Walk Count',
            },
        },
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center mb-4 md:mb-0">
                            <FaDog className="text-blue-600 text-3xl mr-4" />
                            <h1 className="text-2xl font-bold text-gray-800">Dog Walk Statistics</h1>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search dogs.."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 p-2 border rounded-lg text-sm bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64 text-center"
                                />
                            </div>
                            <div className="relative">
                                <FaCalendarAlt className="absolute right-3 top-3 text-green-700" />
                                <select
                                    value={dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                    className="pl-10 p-2 border rounded-lg text-sm bg-gray-50 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64"
                                >
                                    <option value="all">All Time</option>
                                    <option value="last7">Last 7 Days</option>
                                    <option value="last14">Last 14 Days</option>
                                    <option value="lastMonth">Last Month</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Summary Cards */}
                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                            <FaDog className="text-blue-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Dogs</p>
                            <p className="text-2xl font-bold">{filteredLogs.length}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                            <FaWalking className="text-green-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Walks</p>
                            <p className="text-2xl font-bold">
                                {filteredLogs.reduce((sum, log) => sum + log.totalWalks, 0)}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
                        <div className="rounded-full bg-purple-100 p-3 mr-4">
                            <FaWalking className="text-purple-600 text-xl" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Average Walks Per Dog</p>
                            <p className="text-2xl font-bold">
                                {filteredLogs.length ?
                                    (filteredLogs.reduce((sum, log) => sum + log.totalWalks, 0) / filteredLogs.length).toFixed(1) :
                                    '0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                {filteredLogs.length > 0 && (
                    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                        <h2 className="text-lg font-semibold mb-4">Walk Distribution</h2>
                        <Bar data={chartData} options={chartOptions} height={80} />
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-semibold">Detailed Statistics</h2>
                            <p className="text-sm text-gray-500">Complete list of dogs and their walk counts</p>
                        </div>
                        <div className="flex justify-end mt-2 md:mt-0 w-full md:w-auto">
                            <button
                                onClick={fetchLogs}
                                className="bg-green-700 hover:bg-green-900 text-white px-4 py-2 rounded-md text-sm shadow-sm transition-all duration-200 w-full md:w-auto min-w-fit"
                            >
                                🔄 Refresh
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">
                            No dog walk data found for the selected criteria.
                        </div>
                    ) : (
                        <div className="overflow-x-auto px-2 sm:px-4">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Dog Name
                                        </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Walks
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Last Walked
                                </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLogs.map((log, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <FaDog className="text-blue-600" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{log._id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                            <div className="flex items-center">
                                                <div className="text-sm text-gray-900">{log.totalWalks}</div>
                                            </div>
                                                    <div className="ml-2 w-24 bg-gray-200 rounded-full h-2 mt-1">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, (log.totalWalks / (Math.max(...filteredLogs.map(l => l.totalWalks)) || 1)) * 100)}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {log.lastWalked}
                                        </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DogLog;