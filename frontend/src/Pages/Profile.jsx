import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
//import profile from "../assets/profile.png";
const Profile = () => {
    const [user, setUser] = useState(null);
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
            fetchUserDetails(user._id); // Refresh user details after completion
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
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            alert("Walk deleted successfully");
            fetchUserDetails(user._id);  // Refetch user details to update the walk list
        } catch (error) {
            console.error("Error deleting walk:", error);
            alert("Failed to delete walk. Please try again.");
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6 ">
        {/* Profile Header with Image */}
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
                <p><strong>Total Walks:</strong> {user.totalWalks}</p>  {/* Display Total Walks */}
            </div>

           {/* Scheduled Walks Section */}
<h2 className="text-xl font-semibold mt-6">Scheduled Walks</h2>
{user.walks.length === 0 ? (
    <p className="mt-4">No walks scheduled yet.</p>
) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {user.walks.map((walk) => (
            <div key={walk._id} className="p-3 border rounded-md bg-gray-100 shadow-md">
                <p><strong>Scheduled By:</strong> {walk.userid?.firstName} {walk.userid?.lastName || "N/A"}</p>
                <p><strong>Marshall Assigned:</strong> {walk.marshall?.firstName} {walk.marshall?.lastName || "N/A"}</p>
                <p><strong>Date:</strong> {walk.date}</p>
                <p><strong>Time:</strong> {walk.time}</p>

                {/* "Complete Walk" button for User & Marshall */}
                {(walk.userid?._id === user._id || walk.marshall?._id === user._id) && (
                    <button
                        className="mt-2 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                        onClick={() => handleCompleteWalk(walk._id)}
                    >
                        Complete
                    </button>
                )}

                {/* "Delete Walk" button for Admin */}
                {user.role === "admin" && (
                    <div>
                        <button
                            className="mt-2 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 w-full"
                            onClick={() => handleDeleteWalk(walk._id)}
                        >
                            Delete Walk
                        </button>
                    </div>
                )}
            </div>
        ))}
    </div>
)}
        </div>
    );
};

export default Profile;