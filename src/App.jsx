import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ApplicationPage from './pages/ApplicationPage';
import AdminDashboard from './pages/AdminDashboard';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public route - Login/Register */}
        <Route path="/login" element={<AuthPage />} />
        
        {/* Protected route - Application Page (requires login, user role only) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute userOnly={true}>
              <ApplicationPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected route - Admin Dashboard (requires admin role) */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
