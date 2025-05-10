import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import BasicLayout from '../components/Layout/BasicLayout'; // Corrected path
import useAuth from '../hooks/useAuth';

const Routing = () => {
    const { isLoggedIn } = useAuth();

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={isLoggedIn ? <Navigate to="/app/dashboard" replace /> : <HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Private Routes */}
            <Route
                path="/app"
                element={isLoggedIn ? <BasicLayout /> : <Navigate to="/login" replace />}
            >
                <Route path="dashboard" element={<Dashboard />} />
                {/* Add other private routes here, nested under /app */}
            </Route>
        </Routes>
    );
};

export default Routing;