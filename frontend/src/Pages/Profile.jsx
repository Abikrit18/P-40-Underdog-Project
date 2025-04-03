import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";
import formatTimeForDisplay from "../components/Calendar/formatTime";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [scheduledWalks, setScheduledWalks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const walksPerPage = 9;

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                fetchUserDetails(decodedToken.id);
            } catch (error) {
                console.error("Failed to decode token:", error);
                toast.error("Failed to decode token. Please login again.", {
                    position: "top-center",
                    autoClose: 3000
                });
            }
        }
    }, [token]);

    const fetchUserDetails = async (userId) => {
        try {
            const response = await axios.get(`https://p-40-underdog-project-backend.onrender.com/users/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data);
            
            // Filter walks based on user role
            if (response.data.role === "admin") {
                // For admin, get actively scheduled walks, not completed walk logs
                const walksResponse = await axios.get("https://p-40-underdog-project-backend.onrender.com/walks/active", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setScheduledWalks(walksResponse.data || []);
            } else if (response.data.role === "Marshall") {
                // For Marshall, filter out only the walks they are responsible for
                setScheduledWalks(
                    response.data.walks?.filter(walk => 
                        walk.marshall?._id === userId
                    ) || []
                );
            } else {
                // For regular users, show only their scheduled walks
                setScheduledWalks(
                    response.data.walks?.filter(walk => 
                        walk.userid?._id === userId
                    ) || []
                );
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            toast.error("Failed to fetch profile details. Please try again.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleCompleteWalk = async (walkId) => {
        const confirmComplete = window.confirm("Mark this walk as completed?");
        if (!confirmComplete) return;

        try {
            await axios.post(`https://p-40-underdog-project-backend.onrender.com/walks/complete/${walkId}`, { userId: user._id }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            toast.success("Walk marked as completed!", {
                position: "top-center",
                autoClose: 2000
            });
            fetchUserDetails(user._id); // Refresh after completion
        } catch (error) {
            console.error("Error marking walk as completed:", error);
            toast.error("Failed to complete walk. Please try again.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleDidNotShow = async (walkId) => {
        const confirm = window.confirm("Mark this walk as incomplete?");
        if (!confirm) return;

        try {
            await axios.post(`https://p-40-underdog-project-backend.onrender.com/walks/incomplete/${walkId}`, { userId: user._id }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            toast.success("Walk marked as incomplete!", {
                position: "top-center",
                autoClose: 2000
            });
            fetchUserDetails(user._id); // Refresh after action
        } catch (error) {
            console.error("Error marking walk as incomplete:", error);
            toast.error("Failed to mark walk as incomplete. Please try again.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleDeleteWalk = async (walkId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this walk?");
        if (!confirmDelete) return;

        try {
            // For admin, we need to get the walk details first to notify users
            if (user.role === 'admin') {
                const walkDetails = scheduledWalks.find(walk => walk._id === walkId);
                
                // Delete the walk
                await axios.delete(`https://p-40-underdog-project-backend.onrender.com/walks/delete/${walkId}`, {
                    data: { 
                        userId: user._id,
                        notifyUser: true, // Flag to indicate this is an admin deletion
                        affectedUsers: walkDetails?.userid?._id // Pass the user ID to be notified
                    },
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                toast.success("Walk has been deleted and user has been notified.", {
                    position: "top-center",
                    autoClose: 2000
                });
            } else {
                // Regular deletion for non-admin users
                await axios.delete(`https://p-40-underdog-project-backend.onrender.com/walks/delete/${walkId}`, {
                    data: { userId: user._id },
                    headers: { Authorization: `Bearer ${token}` },
                });
                
                toast.success("Walk card successfully removed from profile and deleted.", {
                    position: "top-center",
                    autoClose: 2000
                });
            }
            
            // Immediately update UI by removing the deleted walk
            setScheduledWalks(prevWalks => prevWalks.filter(walk => walk._id !== walkId));
            
        } catch (error) {
            console.error("Error deleting walk:", error);
            toast.error("Failed to delete walk. Please try again.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    // Pagination Logic
    const indexOfLastWalk = currentPage * walksPerPage;
    const indexOfFirstWalk = indexOfLastWalk - walksPerPage;
    const currentWalks = scheduledWalks.slice(indexOfFirstWalk, indexOfLastWalk);
    const totalPages = Math.ceil(scheduledWalks.length / walksPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <ToastContainer />
            {/* Profile Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Profile Details</h1>
                <img
                    src="profile.png"
                    alt="Profile"
                    className="w-24 h-24 object-cover rounded-full border-4 border-gray-300 shadow-md"
                />
            </div>
            <hr className="my-4" />

            <div className="mt-6 space-y-3 bg-white shadow-md rounded-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-center text-gray-800">User Information</h2>
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Total Walks:</strong> {user.totalWalks}</p>
                {user.totalWalks === 0 && !user.waiverSigned && (
                    <div className="mt-6 border border-red-300 bg-red-50 p-4 rounded-md shadow-sm text-center">
                        <p className="text-red-700 font-semibold">You must sign the waiver before scheduling a walk.</p>
                        <Link
                            to="/waiver"
                            className="mt-3 inline-block px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
                        >
                            Sign Waiver
                        </Link>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Scheduled Walks</h2>
                {currentWalks.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                            {currentWalks.map((walk) => (
                                <div key={walk._id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                                    {/* Card Header with Date and Status */}
                                    <div className="bg-blue-50 px-4 py-2 border-b border-gray-200">
                                        <div className="flex justify-between items-center">
                                            <h3 className="font-medium">{walk.date}</h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {user.role === "admin" ? "Scheduled" : "Upcoming"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Card Body */}
                                    <div className="p-4">
                                        <div className="flex items-center mb-3">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-lg">{formatTimeForDisplay(walk.time)}</span>
                                        </div>
                                        
                                        <div className="flex items-start mb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <div>
                                                <p className="text-sm text-gray-500">Marshall</p>
                                                <p className="font-medium">{walk.marshall?.firstName} {walk.marshall?.lastName || "Unknown"}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Display user info always for admin and marshall, and conditionally for regular users */}
                                        {(user.role === "admin" || user.role === "Marshall" || (user.role === "user" && user._id === walk.userid?._id)) && (
                                            <div className="flex items-start">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                <div>
                                                    <p className="text-sm text-gray-500">User</p>
                                                    <p className="font-medium">{walk.userid?.firstName} {walk.userid?.lastName || "Unknown"}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Card Actions */}
                                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() => handleDeleteWalk(walk._id)}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Walk
                                            </button>
                                        )}
                                        
                                        {user._id === walk.marshall?._id && (
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    onClick={() => handleCompleteWalk(walk._id)}
                                                    className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Complete Walk
                                                </button>
                                                <button
                                                    onClick={() => handleDidNotShow(walk._id)}
                                                    className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                    Did Not Show Up
                                                </button>
                                            </div>
                                        )}
                                        
                                        {user.role === "user" && user._id === walk.userid?._id && (
                                            <button
                                                onClick={() => handleDeleteWalk(walk._id)}
                                                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Cancel Walk
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-6">
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                            currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                        disabled={currentPage === 1}
                                    >
                                        <span className="sr-only">Previous</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => paginate(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                                                currentPage === i + 1 ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    
                                    <button
                                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                            currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                        disabled={currentPage === totalPages}
                                    >
                                        <span className="sr-only">Next</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 mt-4 border border-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-600 text-lg">No scheduled walks available.</p>
                        {user.role !== 'admin' && (
                            <Link to="/walk" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {user.role === "Marshall" ? "Add Available Time" : "Schedule a Walk"}
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;