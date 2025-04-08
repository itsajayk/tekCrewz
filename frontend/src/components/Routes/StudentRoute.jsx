// src/components/Routes/StudentRoute.jsx
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

const StudentRoute = ({ children }) => {
    const { currentUser, role } = useContext(AuthContext);

    // If no user is logged in or the role is not 'student', redirect to login.
    if (!currentUser || role !== 'student') {
        return <Navigate to="/s-loginPage" />;
    }

    return children;
};

export default StudentRoute;
