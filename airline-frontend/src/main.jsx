
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Flights from "./pages/Flights.jsx";
import Booking from "./pages/Booking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import "./index.css";
import RoleSelection from "./pages/RoleSelection";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./ProtectedRoute";
import Passengers from "./pages/Passengers";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Baggage from "./pages/Baggage";
import AdminFlights from "./pages/AdminFlights";
import { Navigate } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/home" element={<App />} />

        <Route path="/flights" element={<Flights />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/my-bookings" element={<MyBookings />} />

        <Route path="/login" element={<RoleSelection />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/baggage"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <Baggage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/flights"
          element={
            <ProtectedRoute allowedRole="ADMIN">
              <AdminFlights />
            </ProtectedRoute>
          }
        />
      </Routes>

    </BrowserRouter>
  </StrictMode>
);
