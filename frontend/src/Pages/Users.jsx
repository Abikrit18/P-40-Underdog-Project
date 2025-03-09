import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUser(decodedToken);
                fetchUsers();
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("http://localhost:3000/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(
                `http://localhost:3000/users/${userId}/role`,
                { role: newRole },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setUsers((prevUsers) =>
                prevUsers.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
            );
            
            toast.success("User role updated successfully", {
                position: "top-center",
                autoClose: 3000
            });
            
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update user role", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleDeleteUser = async (userId, role) => {
        if (role === "admin") {
            toast.error("You cannot delete another admin.", {
                position: "top-center",
                autoClose: 3000
            });
            return;
        }

        if (!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            await axios.delete(`http://localhost:3000/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
            toast.success("User deleted successfully.", {
                position: "top-center",
                autoClose: 3000
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    if (!currentUser) return <div className="text-center text-red-500">Loading...</div>;

    return (
        <div className="p-6">
            <ToastContainer />
            <h1 className="text-2xl font-bold mb-4">All Users</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.length === 0 ? (
                    <p>No users found.</p>
                ) : (
                    users.map((user) => (
                        <div key={user._id} className="p-4 border-4 border-gray-300 rounded-md bg-gray-100 shadow-md flex flex-col h-full ">
                            <div>
                                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                                <p><strong>Role:</strong> {user.role}</p>
                                <p><strong>Walks:</strong> {user.totalWalks}</p>
                            </div>

                            
                            <div className="flex items-center justify-between mt-2">
                                {user.role !== "admin" && (
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                        className="p-2 border rounded-md hover:bg-gray-200"
                                    >
                                        <option value="Marshall">Marshall</option>
                                        <option value="user">User</option>
                                    </select>
                                )}

                                {currentUser.role === "admin" && user.role !== "admin" && (
                                    <button
                                        onClick={() => handleDeleteUser(user._id, user.role)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-800"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Users;