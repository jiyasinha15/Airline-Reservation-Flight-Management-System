
import React from "react";
import { useNavigate } from "react-router-dom";
import { Plane, UserRound, ShieldCheck, ArrowRight } from "lucide-react";
import "./RoleSelection.css";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="role-page">
      <nav className="role-nav">
        <div className="role-brand">
          <Plane size={27} />
          <span>AURELIA <b>AIR</b></span>
        </div>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </nav>

      <main className="role-content">
        <span className="role-tag">WELCOME ABROAD</span>
        <h1>Welcome to Aurelia Air</h1>
        <p className="role-subtitle">
          Your journey begins with us. Choose how you want to continue.
        </p>

        <div className="role-cards">
          <div className="role-card">
            <div className="role-icon">
              <UserRound size={36} />
            </div>
            <h2>User</h2>
            <p>
              Explore flights, book tickets and manage
              your reservations with ease.
            </p>
            <button onClick={() => navigate("/login/user")}>
              Continue as User <ArrowRight size={18} />
            </button>
          </div>

          <div className="role-card">
            <div className="role-icon">
              <ShieldCheck size={36} />
            </div>
            <h2>Admin</h2>
            <p>
              Manage flights, passengers, bookings
              and airline operations.
            </p>
            <button onClick={() => navigate("/login/admin")}>
              Continue as Admin <ArrowRight size={18} />
            </button>
          </div>
        </div>

        <div className="role-bottom">
          PREMIUM AIRLINE RESERVATION EXPERIENCE
        </div>
      </main>
    </div>
  );
}
