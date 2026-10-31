
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Plane, UserRound, ShieldCheck, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import "./Login.css";

export default function Login() {
    const { role } = useParams();
    const navigate = useNavigate();

    const isAdmin = role === "admin";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Login UI ready! Backend authentication will be connected next.");
    };

    return (
        <div className="auth-page">
            <nav className="auth-nav">
                <div className="role-brand">
                    <Plane size={26} />
                    AURELIA <b>AIR</b>
                </div>
                <button onClick={() => navigate("/login")}>
                    <ArrowLeft size={16} /> Back
                </button>
            </nav>

            <div className="auth-wrapper">
                <div className="auth-card">
                    <div className="auth-icon">
                        {isAdmin ? <ShieldCheck size={35} /> : <UserRound size={35} />}
                    </div>

                    <span className="auth-tag">
                        {isAdmin ? "ADMIN PORTAL" : "PASSENGER PORTAL"}
                    </span>

                    <h1>{isAdmin ? "Admin Login" : "Welcome Back!"}</h1>

                    <p className="auth-description">
                        {isAdmin
                            ? "Sign in to manage Aurelia Air operations."
                            : "Sign in to explore flights and manage your bookings."}
                    </p>

                    <form onSubmit={handleSubmit}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label>Password</label>
                        <div className="auth-password">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>

                        <button className="auth-submit" type="submit">
                            Sign In
                        </button>
                    </form>

                    {!isAdmin && (
                        <p className="auth-footer">
                            New to Aurelia Air?{" "}
                            <span onClick={() => navigate("/signup")}>
                                Create an account
                            </span>
                        </p>
                    )}

                    {isAdmin && (
                        <p className="auth-footer">
                            Authorized administrators only.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
