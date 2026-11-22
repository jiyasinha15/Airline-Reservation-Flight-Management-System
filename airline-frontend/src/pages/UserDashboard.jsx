
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plane, LayoutDashboard, Ticket, Search, MapPin,
    UserRound, CreditCard, LogOut, Menu, X,
    ArrowRight, Clock, ShieldCheck, Luggage
} from "lucide-react";
import "./UserDashboard.css";

export default function UserDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState({});
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem("aureliaUser");

        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                setUser({});
            }
        }
    }, []);

    const logout = () => {
        localStorage.removeItem("aureliaToken");
        localStorage.removeItem("aureliaUser");
        navigate("/login");
    };

    const actions = [
        {
            title: "Book a Flight",
            description: "Explore available flights and plan your next journey.",
            icon: Plane,
            path: "/flights"
        },
        {
            title: "My Bookings",
            description: "View your reservations and booking details.",
            icon: Ticket,
            path: "/my-bookings"
        },
        {
            title: "Flight Tracker",
            description: "Check the latest status of your flight.",
            icon: MapPin,
            path: "/flight-tracker"
        },
        {
            title: "Payments",
            description: "View your payment information.",
            icon: CreditCard,
            path: "/payments"
        }
    ];

    return (
        <div className="user-dashboard">

            <aside className={`user-sidebar ${menuOpen ? "open" : ""}`}>
                <div className="user-brand">
                    <Plane size={27} />
                    <span>AURELIA <b>AIR</b></span>
                </div>

                <div className="user-profile-mini">
                    <div className="user-avatar">
                        <UserRound size={25} />
                    </div>
                    <div>
                        <h3>{user.name || "Passenger"}</h3>
                        <p>Passenger Account</p>
                    </div>
                </div>

                <p className="sidebar-heading">MAIN MENU</p>

                <button className="user-nav active" onClick={() => navigate("/user/dashboard")}>
                    <LayoutDashboard size={19} /> Dashboard
                </button>

                <button className="user-nav" onClick={() => navigate("/flights")}>
                    <Search size={19} /> Search Flights
                </button>

                <button className="user-nav" onClick={() => navigate("/my-bookings")}>
                    <Ticket size={19} /> My Bookings
                </button>

                <button className="user-nav" onClick={() => navigate("/flight-tracker")}>
                    <MapPin size={19} /> Flight Tracker
                </button>

                <button className="user-nav" onClick={() => navigate("/payments")}>
                    <CreditCard size={19} /> Payments
                </button>

                <div className="sidebar-bottom">
                    <button className="user-nav logout-nav" onClick={logout}>
                        <LogOut size={19} /> Logout
                    </button>
                </div>
            </aside>

            {menuOpen && (
                <div className="user-sidebar-overlay" onClick={() => setMenuOpen(false)} />
            )}

            <main className="user-main">
                <header className="user-topbar">
                    <button className="user-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X /> : <Menu />}
                    </button>

                    <div>
                        <p className="topbar-label">AURELIA AIR / PASSENGER</p>
                        <h2>My Dashboard</h2>
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-user-icon">
                            <UserRound size={20} />
                        </div>
                        <span>{user.name || "Passenger"}</span>
                    </div>
                </header>

                <section className="user-welcome">
                    <div className="welcome-content">
                        <span className="welcome-tag">
                            <ShieldCheck size={15} /> YOUR TRAVEL SPACE
                        </span>
                        <h1>Welcome back, {user.name || "Passenger"}!</h1>
                        <p>
                            Your next journey starts here. Manage your bookings,
                            explore destinations and stay updated with your flights.
                        </p>

                        <button onClick={() => navigate("/flights")}>
                            Explore Flights <ArrowRight size={17} />
                        </button>
                    </div>

                    <div className="welcome-plane">
                        <Plane size={115} strokeWidth={1} />
                    </div>
                </section>

                <section className="dashboard-section">
                    <div className="section-title">
                        <div>
                            <h2>Quick Actions</h2>
                            <p>Everything you need for a smooth journey.</p>
                        </div>
                    </div>

                    <div className="user-action-grid">
                        {actions.map((action) => {
                            const Icon = action.icon;

                            return (
                                <div
                                    className="user-action-card"
                                    key={action.title}
                                    onClick={() => navigate(action.path)}
                                >
                                    <div className="action-icon">
                                        <Icon size={23} />
                                    </div>

                                    <h3>{action.title}</h3>
                                    <p>{action.description}</p>

                                    <span className="action-link">
                                        Open <ArrowRight size={15} />
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="user-info-grid">
                    <div className="user-info-card">
                        <div className="info-icon"><Clock size={22} /></div>
                        <div>
                            <h3>Stay Updated</h3>
                            <p>Track your flight status and get the latest journey information.</p>
                            <button onClick={() => navigate("/flight-tracker")}>
                                Track Flight <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="user-info-card">
                        <div className="info-icon"><Luggage size={22} /></div>
                        <div>
                            <h3>Ready to Travel?</h3>
                            <p>Discover available routes and find your next destination.</p>
                            <button onClick={() => navigate("/flights")}>
                                Find Flights <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>
                </section>

                <footer className="user-footer">
                    © 2026 Aurelia Air. Your journey, our priority.
                </footer>
            </main>
        </div>
    );
}
