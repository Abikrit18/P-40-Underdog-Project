import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (roles.length > 0 && !roles.includes(user?.role)) {
        return <Navigate to="/" />;
    }

    return children;
};

export default ProtectedRoute;