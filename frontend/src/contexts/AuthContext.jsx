// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../components/Pages/firebase';
import { onAuthStateChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
        setCurrentUser(user);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, role, setRole }}>
        {children}
        </AuthContext.Provider>
    );
    };
