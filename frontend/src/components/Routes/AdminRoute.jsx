// src/components/Routes/AdminRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext'; // Updated import path

const AdminRoute = ({ children }) => {
    const { currentUser, role } = useContext(AuthContext);

    // If no user is logged in or the role is not 'admin', redirect to login.
    if (!currentUser || role !== 'admin') {
        return <Navigate to="/login" />;
    }

    return children;
    };

export default AdminRoute;
