import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link } from "react-router-dom";

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
            if (user?.role === "admin") {
                const response = await axios.get("http://localhost:3000/walks");
                setScheduledWalks(response.data);
            } else {
                const response = await axios.get(`http://localhost:3000/users/profile/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(response.data);
                setScheduledWalks(response.data.walks || []);
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
            await axios.post(`http://localhost:3000/walks/complete/${walkId}`, { userId: user._id }, {
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
            await axios.post(`http://localhost:3000/walks/incomplete/${walkId}`, { userId: user._id }, {
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
        await axios.delete(`http://localhost:3000/walks/delete/${walkId}`, {
<<<<<<< HEAD
                data: { userId: user._id },
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success("Walk card successfully removed from profile and deleted.", {
                position: "top-center",
                autoClose: 2000
            });
            fetchUserDetails(user._id);
=======
            data: { userId: user._id },
            headers: { Authorization: `Bearer ${token}` },
        });
        // Immediately update UI by removing the deleted walk
        setScheduledWalks(prevWalks => prevWalks.filter(walk => walk._id !== walkId));
        toast.success("Walk card successfully removed from profile and deleted.", {
            position: "top-center",
            autoClose: 2000
        });
>>>>>>> 49e1aa556b727fb6c91b23a0096a15e8115695a9
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
                <h2 className="text-xl font-semibold">Scheduled Walks</h2>
                {currentWalks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {currentWalks.map((walk) => (
                            <div key={walk._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <p><strong>Date:</strong> {walk.date}</p>
                                <p><strong>Time:</strong> {walk.time}</p>
                                <p><strong>Marshall:</strong> {walk.marshall?.firstName || "Unknown"}</p>
                                <p><strong>Scheduled By:</strong> {walk.userid?.firstName || "Unknown"}</p>
                                {user.role === 'admin' && (
                                    <button
                                        onClick={() => handleDeleteWalk(walk._id)}
                                        className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                    >
                                        Delete Walk
                                    </button>
                                )}
                                {user._id === walk.marshall?._id && (
                                  <>
                                    <button
                                      onClick={() => handleCompleteWalk(walk._id)}
                                      className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full"
                                    >
                                      Complete Walk
                                    </button>
                                    <button
                                      onClick={() => handleDidNotShow(walk._id)}
                                      className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 w-full"
                                    >
                                      Did Not Show Up
                                    </button>
                                  </>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 mt-4">No scheduled walks available.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;