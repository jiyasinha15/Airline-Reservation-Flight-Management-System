
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Plane, LayoutDashboard, Ticket, Search, MapPin,
    UserRound, CreditCard, LogOut, Menu, X,
    ArrowRight, Clock, ShieldCheck, Luggage, CheckCircle2, IndianRupee, Hourglass
} from "lucide-react";
import "./UserDashboard.css";

export default function UserDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);


    const goTo = (path) => {
        navigate(path);
        setMenuOpen(false);
    };
    const [user, setUser] = useState({});

    const [dashboardStats, setDashboardStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        totalPaid: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/user/dashboard`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Unable to load dashboard");
                }

                setDashboardStats(data.stats);
                setRecentBookings(data.recentBookings);

            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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


                <button
                    className={`user-nav ${location.pathname === "/user/dashboard" ? "active" : ""}`}
                    onClick={() => goTo("/user/dashboard")}
                >
                    <LayoutDashboard size={19} /> Dashboard
                </button>

                <button
                    className={`user-nav ${location.pathname === "/flights" ? "active" : ""}`}
                    onClick={() => goTo("/flights")}
                >
                    <Search size={19} /> Search Flights
                </button>

                <button
                    className={`user-nav ${location.pathname === "/my-bookings" ? "active" : ""}`}
                    onClick={() =>
                        navigate("/my-bookings", {
                            state: { from: "dashboard" },
                        })
                    }
                >
                    <Ticket size={19} /> My Bookings
                </button>

                <button
                    className={`user-nav ${location.pathname === "/flight-tracker" ? "active" : ""}`}
                    onClick={() => goTo("/flight-tracker")}
                >
                    <MapPin size={19} /> Flight Tracker
                </button>

                <button
                    className={`user-nav ${location.pathname === "/payments" ? "active" : ""}`}
                    onClick={() => navigate("/payments")}
                >
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

                        <button onClick={() => goTo("/flights")}>
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
                            <h2>Booking Overview</h2>
                            <p>Your travel activity at a glance.</p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="dashboard-loading">Loading your dashboard...</p>
                    ) : (
                        <div className="user-stats-grid">

                            <div className="user-stat-card">
                                <div className="stat-icon blue">
                                    <Ticket size={23} />
                                </div>
                                <div>
                                    <p>Total Bookings</p>
                                    <h2>{dashboardStats.totalBookings}</h2>
                                </div>
                            </div>

                            <div className="user-stat-card">
                                <div className="stat-icon green">
                                    <CheckCircle2 size={23} />
                                </div>
                                <div>
                                    <p>Confirmed</p>
                                    <h2>{dashboardStats.confirmedBookings}</h2>
                                </div>
                            </div>

                            <div className="user-stat-card">
                                <div className="stat-icon orange">
                                    <Hourglass size={23} />
                                </div>
                                <div>
                                    <p>Pending</p>
                                    <h2>{dashboardStats.pendingBookings}</h2>
                                </div>
                            </div>

                            <div className="user-stat-card">
                                <div className="stat-icon gold">
                                    <IndianRupee size={23} />
                                </div>
                                <div>
                                    <p>Total Paid</p>
                                    <h2>₹{Number(dashboardStats.totalPaid).toLocaleString("en-IN")}</h2>
                                </div>
                            </div>

                        </div>
                    )}

                </section>

                <section className="dashboard-section recent-bookings-section">

                    <div className="section-title">
                        <div>
                            <h2>Recent Bookings</h2>
                            <p>Your latest flight reservations.</p>
                        </div>

                        <button
                            className="view-all-bookings"
                            onClick={() => goTo("/my-bookings")}
                        >
                            View All <ArrowRight size={15} />
                        </button>
                    </div>

                    {loading ? (
                        <p className="dashboard-loading">Loading bookings...</p>
                    ) : recentBookings.length === 0 ? (
                        <div className="no-bookings">
                            <Plane size={35} />
                            <h3>No bookings yet</h3>
                            <p>Your flight reservations will appear here.</p>
                            <button onClick={() => goTo("/flights")}>
                                Book Your First Flight
                            </button>
                        </div>
                    ) : (
                        <div className="recent-bookings-table-wrapper">
                            <table className="recent-bookings-table">
                                <thead>
                                    <tr>
                                        <th>PNR</th>
                                        <th>Flight</th>
                                        <th>Route</th>
                                        <th>Booking Date</th>
                                        <th>Booking Status</th>
                                        <th>Payment</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentBookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="pnr-cell">{booking.pnr}</td>

                                            <td>
                                                <strong>{booking.flight_code}</strong>
                                                <small>{booking.airline}</small>
                                            </td>

                                            <td>
                                                <strong>
                                                    {booking.origin} → {booking.destination}
                                                </strong>
                                                <small>
                                                    {String(booking.departure_time).slice(0, 5)}
                                                    {" - "}
                                                    {String(booking.arrival_time).slice(0, 5)}
                                                </small>
                                            </td>

                                            <td>
                                                {new Date(booking.booking_date).toLocaleDateString("en-IN")}
                                            </td>

                                            <td>
                                                <span className={`booking-status ${booking.booking_status.toLowerCase()}`}>
                                                    {booking.booking_status}
                                                </span>
                                            </td>

                                            <td>
                                                <span className={`payment-status ${booking.payment_status.toLowerCase()}`}>
                                                    {booking.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

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
                                    onClick={() => goTo(action.path)}
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
                            <button onClick={() => goTo("/flight-tracker")}>
                                Track Flight <ArrowRight size={15} />
                            </button>
                        </div>
                    </div>

                    <div className="user-info-card">
                        <div className="info-icon"><Luggage size={22} /></div>
                        <div>
                            <h3>Ready to Travel?</h3>
                            <p>Discover available routes and find your next destination.</p>
                            <button onClick={() => goTo("/flights")}>
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
