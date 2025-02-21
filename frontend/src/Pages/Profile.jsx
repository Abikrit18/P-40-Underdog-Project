import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const walksPerPage = 9; // Show 9 cards per page

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                fetchUserDetails(decodedToken.id);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, [token]);

    const fetchUserDetails = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:3000/users/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUser(response.data);
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    };

    const handleCompleteWalk = async (walkId) => {
        const confirmComplete = window.confirm("Mark this walk as completed?");
        if (!confirmComplete) return;

        try {
            await axios.post(`http://localhost:3000/walks/complete/${walkId}`, { userId: user._id }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            alert("Walk marked as completed!");
            fetchUserDetails(user._id); // Refresh after completion
        } catch (error) {
            console.error("Error marking walk as completed:", error);
            alert("Failed to complete walk. Please try again.");
        }
    };

    const handleDeleteWalk = async (walkId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this walk?");
        if (!confirmDelete) return;

        try {
            await axios.delete(`http://localhost:3000/walks/${walkId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Walk deleted successfully");
            fetchUserDetails(user._id);
        } catch (error) {
            console.error("Error deleting walk:", error);
            alert("Failed to delete walk. Please try again.");
        }
    };

    // Pagination Logic
    const indexOfLastWalk = currentPage * walksPerPage;
    const indexOfFirstWalk = indexOfLastWalk - walksPerPage;
    const currentWalks = user?.walks.slice(indexOfFirstWalk, indexOfLastWalk);
    const totalPages = Math.ceil((user?.walks.length || 0) / walksPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (!user) return <div>Loading...</div>;

    return (
        <div className="p-6">
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

            <div className="mt-4">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Total Walks:</strong> {user.totalWalks}</p>
            </div>

            {/* Scheduled Walks */}
            <h2 className="text-xl font-semibold mt-6">Scheduled Walks</h2>

            {currentWalks.length === 0 ? (
                <p className="mt-4">No walks scheduled yet.</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {currentWalks.map((walk) => (
                            <div key={walk._id} className="p-4 border rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 shadow-lg hover:shadow-2xl transition-shadow duration-300">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-indigo-700">Scheduled Walk</h3>
                                    <span className="text-sm font-semibold text-gray-500">{walk.date} | {walk.time}</span>
                                </div>

                                <div className="space-y-1 text-gray-700">
                                    <p><strong>Scheduled By:</strong> {walk.userid?.firstName} {walk.userid?.lastName || "N/A"}</p>
                                    <p><strong>Marshall Assigned:</strong> {walk.marshall?.firstName} {walk.marshall?.lastName || "N/A"}</p>
                                </div>

                                <div className="flex justify-between items-center mt-4">
                                    {/* Complete Walk */}
                                    {(walk.marshall?._id === user._id) && (
                                        <button
                                            className="relative flex items-center px-5 py-2 overflow-hidden font-medium bg-green-600 rounded-md group hover:bg-green-700 transition-all"
                                            onClick={() => handleCompleteWalk(walk._id)}
                                        >
                                            Complete Walk
                                        </button>
                                    )}

                                    {/* Delete Walk (Admin Only) */}
                                    {user.role === "admin" && (
                                        <button
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                                            onClick={() => handleDeleteWalk(walk._id)}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 space-x-2">
                            {[...Array(totalPages).keys()].map((number) => (
                                <button
                                    key={number + 1}
                                    onClick={() => paginate(number + 1)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-full text-white ${currentPage === number + 1 ? 'bg-indigo-600' : 'bg-gray-400'} hover:bg-indigo-500 transition-all`}
                                >
                                    {number + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Profile;