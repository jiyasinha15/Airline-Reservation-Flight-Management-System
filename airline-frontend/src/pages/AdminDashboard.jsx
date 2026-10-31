import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane, Users, Ticket, CreditCard, LogOut
} from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/flights")
      .then((res) => res.json())
      .then((data) => setFlights(data.flights || []))
      .catch((err) => console.error("Flight fetch error:", err));
  }, []);

  const logout = () => {
    localStorage.removeItem("aureliaToken");
    localStorage.removeItem("aureliaUser");
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <h2><Plane /> AURELIA AIR</h2>
        <p>ADMIN PANEL</p>
        <button onClick={() => navigate("/")}>View Website</button>
        <button className="admin-logout" onClick={logout}>
          <LogOut size={17} /> Logout
        </button>
      </aside>

      <main className="admin-main">
        <h1>Dashboard Overview</h1>
        <p>Welcome to Aurelia Air Administration.</p>

        <div className="admin-stats">
          <div className="admin-stat">
            <Plane />
            <h3>{flights.length}</h3>
            <p>Total Flights</p>
          </div>

          <div className="admin-stat">
            <Users />
            <h3>Manage</h3>
            <p>Passengers</p>
          </div>

          <div className="admin-stat">
            <Ticket />
            <h3>Manage</h3>
            <p>Bookings</p>
          </div>

          <div className="admin-stat">
            <CreditCard />
            <h3>Manage</h3>
            <p>Payments</p>
          </div>
        </div>

        <section className="admin-flight-section">
          <h2>Flight Overview</h2>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Airline</th>
                  <th>Route</th>
                  <th>Price</th>
                  <th>Seats</th>
                </tr>
              </thead>

              <tbody>
                {flights.map((flight) => (
                  <tr key={flight.id}>
                    <td>{flight.flightCode}</td>
                    <td>{flight.airline}</td>
                    <td>{flight.from} → {flight.to}</td>
                    <td>₹{Number(flight.price).toLocaleString("en-IN")}</td>
                    <td>{flight.availableSeats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}