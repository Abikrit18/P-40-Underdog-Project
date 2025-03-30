import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const WaiverForm = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, [token]);

    const handleWaiverSubmit = async () => {
        if (!user?.id) {
            alert("Error: User ID is missing. Please log in again.");
            return;
        }

        try {
        await axios.post("https://p-40-underdog-project-backend.onrender.com/users/waiver/sign", { userId: user.id });

        // Fetch updated user data to reflect waiver signing
        const updatedUser = await axios.get(`https://p-40-underdog-project-backend.onrender.com/users/profile/${user.id}`);
        setUser(prevUser => ({ ...prevUser, waiverSigned: true }));

        alert("Waiver signed successfully!");
        navigate("/walk"); // Redirect user to Walk page after signing
        } catch (error) {
            console.error("Error signing waiver:", error);
            alert("Failed to sign waiver. Please try again.");
        }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md text-center border-2 border-blue-100">
                <h1 className="text-xl font-bold">Waiver Form</h1>
                <p className="text-gray-600 mt-4">
                    Please read and agree to the waiver before scheduling a walk.
                </p>
                <div className="mt-4 text-left">
                    <p className="text-gray-700">
                        I, the undersigned, understand and acknowledge that walking dogs involves potential risks, 
                        including but not limited to injuries caused by animals, environmental hazards, and physical exertion.
                    </p>
                </div>
                <button
                    className="mt-6 px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
                    onClick={handleWaiverSubmit}
                >
                    Agree & Sign
                </button>
            </div>
        </div>
    );
};

export default WaiverForm;