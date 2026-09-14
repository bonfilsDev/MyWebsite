
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import CashierDashboard from './pages/cashier/CashierDashboard';

function HomeRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (user.role === 'cashier') {
    return <Navigate to="/cashier" replace />;
  }

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <Routes>

        {/* Home */}
        <Route path="/" element={<HomeRedirect />} />

        {/* Login */}
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Cashier Dashboard */}
        <Route
          path="/cashier/*"
          element={
            <ProtectedRoute roles={['cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: '14px',
            borderRadius: '10px',
          },
          success: {
            iconTheme: {
              primary: '#0d9488',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}