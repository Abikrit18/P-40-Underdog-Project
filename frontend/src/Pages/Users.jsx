import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentUser, setCurrentUser] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setCurrentUser(decodedToken);
                fetchUsers();
            } catch (error) {
                console.error("Failed to decode token:", error);
                toast.error("Invalid token. Please log in again.", {
                    position: "top-center",
                    autoClose: 3000
                });
            }
        }
    }, [token]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("https://p-40-underdog-project-backend.onrender.com/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Failed to fetch users. Please try again later.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await axios.put(
                `https://p-40-underdog-project-backend.onrender.com/users/${userId}/role`,
                { role: newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedUsers = users.map((u) =>
                u._id === userId ? { ...u, role: newRole } : u
            );

            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers); // Update filtered users immediately after role change
            toast.success(`User role updated to ${newRole}`, {
                position: "top-center",
                autoClose: 2000
            });
        } catch (error) {
            console.error("Error updating role:", error);
            toast.error("Failed to update user role.", {
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
            await axios.delete(`https://p-40-underdog-project-backend.onrender.com/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            // Update both users and filteredUsers immediately after deletion
            const updatedUsers = users.filter((user) => user._id !== userId);
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers); // <-- Ensure filtered list updates too
    
            toast.success("User deleted successfully.", {
                position: "top-center",
                autoClose: 2000
            });
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user.", {
                position: "top-center",
                autoClose: 3000
            });
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        filterUsers(term);
    };

    const filterUsers = (term) => {
        const filtered = users.filter(
            (user) =>
                user.firstName.toLowerCase().includes(term.toLowerCase()) ||
                user.lastName.toLowerCase().includes(term.toLowerCase()) ||
                user.email.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredUsers(filtered);
        setCurrentPage(1); // Reset to first page after search
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Pagination logic
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    if (!currentUser) return <div className="text-center text-red-500">Loading...</div>;

    return (
        <div className="p-6">
            <ToastContainer />
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">All Users</h1>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="shadow-lg focus:border-2 border-gray-300 px-5 py-3 rounded-xl w-56 transition-all focus:w-64 outline-none"
                    />
                    <svg
                        className="size-6 absolute top-3 right-3 text-gray-500"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                    <thead>
                        <tr className="bg-gray-900 text-gray-200 text-left">
                            <th className="py-2 px-4 border">Name</th>
                            <th className="py-2 px-4 border">Email</th>
                            <th className="py-2 px-4 border">Role</th>
                            <th className="py-2 px-4 border">Total Walks</th>
                            <th className="py-2 px-4 border">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentUsers.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-4">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            currentUsers.map((user) => (
                                <tr key={user._id} className="border-t">
                                    <td className="py-2 px-4 border">{user.firstName} {user.lastName}</td>
                                    <td className="py-2 px-4 border">{user.email}</td>
                                    <td className="py-2 px-4 border">
                                        {user.role !== "admin" ? (
                                            <select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                className="p-1 border rounded-md"
                                            >
                                                <option value="Marshall">Marshall</option>
                                                <option value="user">User</option>
                                            </select>
                                        ) : (
                                            "Admin"
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border">{user.totalWalks}</td>
                                    <td className="py-2 px-1 border text-center w-28">
                                        {currentUser.role === "admin" && user.role !== "admin" && (
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.role)}
                                                className="inline-flex items-center justify-center w-full px-2 py-1 bg-red-700 transition ease-in-out delay-75 hover:bg-red-800 text-white text-sm font-medium rounded-md hover:-translate-y-1 hover:scale-105"
                                            >
                                                <svg
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    className="h-5 w-5 mr-1"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                >
                                                    <path
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        strokeWidth="2"
                                                        strokeLinejoin="round"
                                                        strokeLinecap="round"
                                                    ></path>
                                                </svg>
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/*  Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => paginate(i + 1)}
                            className={`w-10 h-10  flex items-center justify-center rounded-full shadow-md transition-colors duration-300 ${currentPage === i + 1
                                ? "bg-red-900 text-white font-bold"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-500 hover:text-dark-900"
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;