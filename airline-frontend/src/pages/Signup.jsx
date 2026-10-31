import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    alert("Signup UI ready! Database connection will be added next.");
  };

  return (
    <div className="signup-page">
      <nav className="signup-nav">
        <div className="signup-brand">
          <Plane size={25} /> AURELIA <b>AIR</b>
        </div>

        <button onClick={() => navigate("/login/user")}>
          <ArrowLeft size={16} /> Back to Login
        </button>
      </nav>

      <div className="signup-wrapper">
        <div className="signup-card">
          <span className="signup-tag">JOIN AURELIA AIR</span>
          <h1>Create Account</h1>
          <p>Begin your journey with us.</p>

          <form onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <label>Password</label>
            <div className="signup-password">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <button className="signup-submit" type="submit">
              Create Account
            </button>
          </form>

          <div className="signup-footer">
            Already have an account?{" "}
            <span onClick={() => navigate("/login/user")}>Sign In</span>
          </div>
        </div>
      </div>
    </div>
  );
}