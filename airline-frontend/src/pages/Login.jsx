
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Plane, UserRound, ShieldCheck, Eye, EyeOff, ArrowLeft
} from "lucide-react";
import "./Login.css";

export default function Login() {
    const { role } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const isAdmin = role === "admin";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email,
                        password,
                        role: isAdmin ? "ADMIN" : "USER",
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Login failed!");
                return;
            }

            localStorage.setItem("aureliaToken", data.token);
            localStorage.setItem("aureliaUser", JSON.stringify(data.user));

            alert("Login successful! Welcome to Aurelia Air.");

            if (isAdmin) {
                navigate("/admin/dashboard");
            } else {
                navigate("/");
            }

        } catch (error) {
            console.error("Login error:", error);
            alert("Unable to connect to server.");
        } finally {
            setLoading(false);
        }
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

                        <button
                            className="auth-submit"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Signing In..." : "Sign In"}
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
