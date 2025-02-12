import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    // useRef to store the inactivity timer across renders
    const inactivityTimer = useRef(null);
    const INACTIVITY_LIMIT = 2 * 60 * 1000; // 2 minutes in milliseconds

    const resetTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        inactivityTimer.current = setTimeout(() => {
            alert('Session timed out due to inactivity');
            navigate('/login');
        }, INACTIVITY_LIMIT);
    }, [navigate]);

    useEffect(() => {
        // Set the initial timer when the component mounts.
        resetTimer();

        // List of events that count as user activity.
        const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
        events.forEach((event) => window.addEventListener(event, resetTimer));

        // Cleanup the event listeners and timeout on unmount.
        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [navigate]);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold">Profile Page</h1>
            <p>Welcome to your profile. You can browse your profile data here.</p>
            {/* Add more profile-related elements and navigation as needed */}
        </div>
    );
}