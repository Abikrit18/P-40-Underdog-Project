import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const Profile = () => {
    const [user, setUser] = useState(null);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                fetchUserDetails(decodedToken.id);  // Use the user ID from the token
            } catch (error) {
                console.error('Failed to decode token:', error);
            }
        }
    }, [token]);

    const fetchUserDetails = async (userId) => {
        try {
            const response = await axios.get(`http://localhost:3000/users/profile/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setUser(response.data);
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Profile Details</h1>
            <hr className="my-4" />
            <div className="mt-4">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
                {console.log(user)}

            </div>
            <h2 className="text-xl font-semibold mt-6">Scheduled Walks</h2>
            {user.walks.length === 0 ? (
                <p className="mt-4">No walks scheduled yet.</p>
            ) : (
                <ul className="mt-4 space-y-2">
                    {user.walks.map((walk) => (
                        <li key={walk._id} className="p-4 border rounded-md bg-gray-100">
                            <p>
                                <strong>Marshall:</strong> {walk.marshall}
                            </p>
                            <p>
                                <strong>Date:</strong> {walk.date}
                            </p>
                            <p>
                                <strong>Time:</strong> {walk.time}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Profile;