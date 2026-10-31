import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plane,
    LayoutDashboard,
    Users,
    Ticket,
    CreditCard,
    Luggage,
    Settings,
    LogOut,
    Search,
    Bell,
    ArrowUpRight,
    MapPin,
    Clock3,
    RefreshCw,
} from "lucide-react";

import "./AdminDashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [flights, setFlights] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const user = JSON.parse(
        localStorage.getItem("aureliaUser") || "null"
    );

    const loadDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const [flightResponse, statsResponse] = await Promise.all([
                fetch("http://localhost:5000/api/flights"),
                fetch("http://localhost:5000/api/admin/stats", {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
                    },
                }),
            ]);

            if (!flightResponse.ok || !statsResponse.ok) {
                throw new Error("Unable to load dashboard data.");
            }

            const flightData = await flightResponse.json();
            const statsData = await statsResponse.json();

            setFlights(flightData.flights || []);
            setStats(statsData.stats);
        } catch (err) {
            console.error(err);
            setError("Dashboard data could not be loaded. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const logout = () => {
        localStorage.removeItem("aureliaToken");
        localStorage.removeItem("aureliaUser");
        navigate("/login");
    };

    const filteredFlights = flights.filter((flight) => {
        const term = search.toLowerCase();

        return (
            flight.flightCode?.toLowerCase().includes(term) ||
            flight.airline?.toLowerCase().includes(term) ||
            flight.from?.toLowerCase().includes(term) ||
            flight.to?.toLowerCase().includes(term)
        );
    });

    const statCards = [
        {
            title: "Total Flights",
            value: stats?.totalFlights ?? "—",
            icon: Plane,
            note: "Flights in database",
        },
        {
            title: "Total Passengers",
            value: stats?.totalPassengers ?? "—",
            icon: Users,
            note: "Registered passengers",
        },
        {
            title: "Total Bookings",
            value: stats?.totalBookings ?? "—",
            icon: Ticket,
            note: `${stats?.pendingBookings ?? 0} pending bookings`,
        },
        {
            title: "Successful Payments",
            value:
                stats === null
                    ? "—"
                    : `₹${stats.totalRevenue.toLocaleString("en-IN")}`,
            icon: CreditCard,
            note: "Revenue from successful payments",
        },
    ];

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-logo">
                    <div className="admin-logo-icon">
                        <Plane size={23} />
                    </div>
                    <div>
                        <h2>AURELIA</h2>
                        <span>AIR ADMIN</span>
                    </div>
                </div>

                <div className="sidebar-label">MAIN MENU</div>

                <nav className="admin-navigation">
                    <button className="nav-item active">
                        <LayoutDashboard size={19} />
                        Dashboard
                    </button>

                    <button className="nav-item" onClick={() => navigate("/flights")}>
                        <Plane size={19} />
                        Flights
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/admin/bookings")}
                    >
                        <Ticket size={19} />
                        Bookings
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/admin/passengers")}
                    >
                        <Users size={19} />
                        Passengers
                    </button>

                    <button
                        className="nav-item"
                        onClick={() => navigate("/admin/payments")}
                    >
                        <CreditCard size={19} />
                        Payments
                    </button>

                    <button className="nav-item">
                        <Luggage size={19} />
                        Baggage
                    </button>
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-label">PREFERENCES</div>
                    <button className="nav-item">
                        <Settings size={19} />
                        Settings
                    </button>

                    <button className="admin-logout" onClick={logout}>
                        <LogOut size={19} />
                        Sign Out
                    </button>
                </div>

                <div className="sidebar-version">Aurelia Air · Admin Panel</div>
            </aside>

            <main className="admin-content">
                <header className="admin-topbar">
                    <div className="admin-breadcrumb">
                        <span>Pages</span>
                        <span>/</span>
                        <strong>Dashboard</strong>
                    </div>

                    <div className="admin-top-actions">
                        <div className="admin-date">
                            <Clock3 size={16} />
                            Operations Overview
                        </div>

                        <button
                            className="admin-icon-button"
                            onClick={loadDashboard}
                            title="Refresh dashboard"
                        >
                            <RefreshCw size={18} />
                        </button>

                        <div className="admin-profile">
                            <div className="admin-avatar">
                                {(user?.name || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <strong>{user?.name || "Administrator"}</strong>
                                <span>Administrator</span>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="admin-welcome">
                    <div>
                        <span className="admin-eyebrow">AURELIA AIR OPERATIONS</span>
                        <h1>Dashboard Overview</h1>
                        <p>
                            Welcome back, {user?.name || "Administrator"}.
                            Here's what's happening with your airline today.
                        </p>
                    </div>

                    <button className="refresh-button" onClick={loadDashboard}>
                        <RefreshCw size={16} />
                        Refresh Data
                    </button>
                </section>

                {error && (
                    <div className="admin-error">
                        {error}
                        <button onClick={loadDashboard}>Retry</button>
                    </div>
                )}

                <section className="admin-stat-grid">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div className="admin-stat-card" key={card.title}>
                                <div className="stat-card-top">
                                    <span>{card.title}</span>
                                    <div className="stat-icon">
                                        <Icon size={21} />
                                    </div>
                                </div>

                                <h2>
                                    {loading ? "..." : card.value}
                                </h2>

                                <p>{card.note}</p>
                            </div>
                        );
                    })}
                </section>

                <section className="admin-overview-grid">
                    <div className="admin-panel booking-panel">
                        <div className="panel-heading">
                            <div>
                                <span className="panel-eyebrow">BOOKING OVERVIEW</span>
                                <h2>Booking Status</h2>
                            </div>
                            <Ticket size={21} />
                        </div>

                        <div className="booking-status-row">
                            <div>
                                <span className="status-dot confirmed-dot" />
                                Confirmed
                            </div>
                            <strong>
                                {loading ? "..." : stats?.confirmedBookings ?? 0}
                            </strong>
                        </div>

                        <div className="booking-status-row">
                            <div>
                                <span className="status-dot pending-dot" />
                                Pending
                            </div>
                            <strong>
                                {loading ? "..." : stats?.pendingBookings ?? 0}
                            </strong>
                        </div>

                        <div className="booking-status-row">
                            <div>
                                <span className="status-dot total-dot" />
                                Total Bookings
                            </div>
                            <strong>
                                {loading ? "..." : stats?.totalBookings ?? 0}
                            </strong>
                        </div>
                    </div>

                    <div className="admin-panel quick-panel">
                        <span className="panel-eyebrow">QUICK ACCESS</span>
                        <h2>Manage Operations</h2>
                        <p>Quickly access your airline management pages.</p>

                        <button onClick={() => navigate("/flights")}>
                            <Plane size={18} />
                            View Flights
                            <ArrowUpRight size={17} />
                        </button>

                        <button onClick={() => navigate("/my-bookings")}>
                            <Ticket size={18} />
                            View Bookings
                            <ArrowUpRight size={17} />
                        </button>

                        <button onClick={() => navigate("/admin/passengers")}>
                            <Users size={18} />
                            View Passengers
                            <ArrowUpRight size={17} />
                        </button>
                    </div>
                </section>

                <section className="admin-panel flight-panel">
                    <div className="flight-panel-heading">
                        <div>
                            <span className="panel-eyebrow">FLIGHT MANAGEMENT</span>
                            <h2>Flight Schedule</h2>
                            <p>Flights currently available in your database.</p>
                        </div>

                        <div className="flight-search">
                            <Search size={17} />
                            <input
                                type="text"
                                placeholder="Search flights..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="admin-table-container">
                        <table className="admin-flight-table">
                            <thead>
                                <tr>
                                    <th>FLIGHT</th>
                                    <th>AIRLINE</th>
                                    <th>ROUTE</th>
                                    <th>DEPARTURE</th>
                                    <th>ARRIVAL</th>
                                    <th>PRICE</th>
                                    <th>SEATS</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="empty-table">
                                            Loading flights...
                                        </td>
                                    </tr>
                                ) : filteredFlights.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="empty-table">
                                            No flights found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredFlights.map((flight) => (
                                        <tr key={flight.id}>
                                            <td className="flight-code">
                                                {flight.flightCode}
                                            </td>
                                            <td>{flight.airline}</td>
                                            <td>
                                                <span className="route-cell">
                                                    <MapPin size={14} />
                                                    {flight.from} → {flight.to}
                                                </span>
                                            </td>
                                            <td>{flight.departureTime}</td>
                                            <td>{flight.arrivalTime}</td>
                                            <td>
                                                ₹{Number(flight.price).toLocaleString("en-IN")}
                                            </td>
                                            <td>
                                                <span className="seat-badge">
                                                    {flight.availableSeats}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flight-table-footer">
                        Showing {loading ? "..." : filteredFlights.length} flights
                        <span>Live database data</span>
                    </div>
                </section>

                <footer className="admin-footer">
                    © 2026 Aurelia Air. All rights reserved.
                    <span>Airline Reservation & Flight Management System</span>
                </footer>
            </main>
        </div>
    );
}