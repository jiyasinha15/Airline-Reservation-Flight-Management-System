import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, ArrowLeft, Eye, EyeOff } from "lucide-react";
import "./Signup.css";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Signup failed!");
        return;
      }

      alert("Account created successfully!");

      navigate("/login/user");
    } catch (error) {
      console.error("Signup error:", error);
      alert("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
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

            <button
              className="signup-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
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