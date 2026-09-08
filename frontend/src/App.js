import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/App.css";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import CreateTicket from "@/pages/CreateTicket";
import Users from "@/pages/Users";
import Customers from "@/pages/Customers";
import Categories from "@/pages/Categories";
import Reports from "@/pages/Reports";
import KPIScores from "@/pages/KPIScores";
import AuditLog from "@/pages/AuditLog";
import SettingsPage from "@/pages/Settings";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tickets" element={<ProtectedRoute roles={["admin","manager","supervisor","technician"]}><Tickets /></ProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute roles={["customer"]}><Tickets /></ProtectedRoute>} />
            <Route path="/tickets/new" element={<CreateTicket />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/kpi" element={<ProtectedRoute roles={["admin","manager","supervisor","technician"]}><KPIScores /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute roles={["admin","manager","supervisor"]}><Reports /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute roles={["admin","manager"]}><Users /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute roles={["admin","manager","supervisor"]}><Customers /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute roles={["admin","manager"]}><Categories /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute roles={["admin","manager"]}><SettingsPage /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute roles={["admin","manager"]}><AuditLog /></ProtectedRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}
