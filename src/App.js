// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Dashboard from './components/Dashboard';
import './index.css';
// Update your existing src/App.js
// Add this import at the top:
import ForgotPassword from './components/auth/ForgotPassword';

// Placeholder components for other modules
const ComingSoon = ({ title }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
      <p className="text-gray-600">This module is coming soon!</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Module Routes (Placeholders) */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Chat Module" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Events & Clubs" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/helpdesk"
              element={
                <ProtectedRoute>
                  <ComingSoon title="HelpDesk" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/career"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Career Portal" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lost-found"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Lost & Found" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute>
                  <ComingSoon title="AI Assistant" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Notifications" />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <ComingSoon title="Settings" />
                </ProtectedRoute>
              }
            />

            {/* Admin only routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <ComingSoon title="Admin Panel" />
                </ProtectedRoute>
              }
            />

            // Add this route in your Routes section with other public routes:
            <Route path="/forgot-password" element={<ForgotPassword />} />


            {/* Redirect routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;