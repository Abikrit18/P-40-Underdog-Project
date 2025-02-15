import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Set up token expiry check
        const checkTokenExpiry = () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No token found');
                }

                // Get payload from token
                const payload = JSON.parse(atob(token.split('.')[1]));
                
                // Check if token has expired
                if (payload.exp * 1000 < Date.now()) {
                    throw new Error('Token expired');
                }
            } catch (error) {
                console.log('Token validation failed:', error.message);
                localStorage.removeItem('token');
                navigate('/login');
            }
        };

        // Check token immediately
        checkTokenExpiry();

        // Set up periodic checks
        const interval = setInterval(checkTokenExpiry, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [navigate]);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold">Profile Page</h1>
            <p>Welcome to your profile. You can browse your profile data here.</p>
            <p className="text-sm text-gray-500 mt-2">
                Note: Your session will expire after 2 minutes of inactivity
            </p>
        </div>
    );
}