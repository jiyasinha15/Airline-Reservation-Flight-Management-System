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
    Pencil,
    X,
    Save,
    CalendarClock,
} from "lucide-react";

import "./AdminDashboard.css";

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [flights, setFlights] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    const [selectedFlight, setSelectedFlight] = useState(null);
    const [savingFlight, setSavingFlight] = useState(false);
    const [operationMessage, setOperationMessage] = useState("");

    const [operationForm, setOperationForm] = useState({
        status: "SCHEDULED",
        boarding_time: "",
        actual_departure_time: "",
        actual_arrival_time: "",
        revised_departure_time: "",
        revised_arrival_time: "",
        delay_reason: "",
        cancellation_reason: "",
    });

    const openFlightEditor = (flight) => {
        setSelectedFlight(flight);
        setOperationMessage("");

        setOperationForm({
            status: flight.status || "SCHEDULED",
            boarding_time: flight.boardingTime || "",
            actual_departure_time: flight.actualDepartureTime || "",
            actual_arrival_time: flight.actualArrivalTime || "",
            revised_departure_time: flight.revisedDepartureTime || "",
            revised_arrival_time: flight.revisedArrivalTime || "",
            delay_reason: flight.delayReason || "",
            cancellation_reason: flight.cancellationReason || "",
        });
    };

    const closeFlightEditor = () => {
        setSelectedFlight(null);
        setOperationMessage("");
    };

    const handleOperationChange = (e) => {
        const { name, value } = e.target;

        setOperationForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const saveFlightOperations = async (e) => {
        e.preventDefault();

        if (!selectedFlight) return;

        try {
            setSavingFlight(true);
            setOperationMessage("");

            const token = localStorage.getItem("aureliaToken");

            const payload = {
                airline: selectedFlight.airline,
                flight_code: selectedFlight.flightCode,
                origin: selectedFlight.from,
                destination: selectedFlight.to,
                departure_time: selectedFlight.departureTime,
                arrival_time: selectedFlight.arrivalTime,
                price: Number(selectedFlight.price),
                available_seats: Number(selectedFlight.availableSeats),

                status: operationForm.status,

                boarding_time: operationForm.boarding_time || null,
                actual_departure_time: operationForm.actual_departure_time || null,
                actual_arrival_time: operationForm.actual_arrival_time || null,
                revised_departure_time: operationForm.revised_departure_time || null,
                revised_arrival_time: operationForm.revised_arrival_time || null,

                delay_reason: operationForm.delay_reason.trim() || null,
                cancellation_reason: operationForm.cancellation_reason.trim() || null,
            };

            const response = await fetch(
                `http://localhost:5000/api/admin/flights/${selectedFlight.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to update flight.");
            }

            setOperationMessage("Flight operations updated successfully!");

            await loadDashboard();
            setSelectedFlight(null);

        } catch (err) {
            console.error("Flight update error:", err);
            setOperationMessage(err.message);
        } finally {
            setSavingFlight(false);
        }
    };

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

                    <button
                        className="nav-item"
                        onClick={() => navigate("/admin/flights")}
                    >
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

                    <button
                        className="nav-item"
                        onClick={() => navigate("/admin/baggage")}
                    >
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

                        <button onClick={() => navigate("/admin/flights")}>
                            <Plane size={18} />
                            Manage Flights
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
                                    <th>STATUS</th>
                                    <th>ACTIONS</th>
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
                                            <td>
                                                <span className={`flight-status-badge ${(flight.status || "SCHEDULED").toLowerCase()}`}>
                                                    {flight.status || "SCHEDULED"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    className="flight-manage-button"
                                                    onClick={() => openFlightEditor(flight)}
                                                >
                                                    <Pencil size={15} />
                                                    Manage
                                                </button>
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

                {selectedFlight && (
                    <div className="flight-editor-overlay">
                        <div className="flight-editor-modal">

                            <div className="flight-editor-header">
                                <div>
                                    <span className="panel-eyebrow">FLIGHT OPERATIONS</span>
                                    <h2>Manage {selectedFlight.flightCode}</h2>
                                    <p>
                                        {selectedFlight.from} → {selectedFlight.to}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="flight-editor-close"
                                    onClick={closeFlightEditor}
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <form onSubmit={saveFlightOperations}>

                                <div className="operation-form-grid">

                                    <div className="operation-field full-width">
                                        <label>Flight Status</label>

                                        <select
                                            name="status"
                                            value={operationForm.status}
                                            onChange={handleOperationChange}
                                        >
                                            <option value="SCHEDULED">Scheduled</option>
                                            <option value="BOARDING">Boarding</option>
                                            <option value="DELAYED">Delayed</option>
                                            <option value="CANCELLED">Cancelled</option>
                                            <option value="DEPARTED">Departed</option>
                                            <option value="IN_AIR">In Air</option>
                                            <option value="ARRIVED">Arrived</option>
                                        </select>
                                    </div>

                                    <div className="operation-field">
                                        <label>Boarding Time</label>
                                        <input
                                            type="time"
                                            name="boarding_time"
                                            value={operationForm.boarding_time}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field">
                                        <label>Actual Departure</label>
                                        <input
                                            type="time"
                                            name="actual_departure_time"
                                            value={operationForm.actual_departure_time}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field">
                                        <label>Actual Arrival</label>
                                        <input
                                            type="time"
                                            name="actual_arrival_time"
                                            value={operationForm.actual_arrival_time}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field">
                                        <label>Revised Departure</label>
                                        <input
                                            type="time"
                                            name="revised_departure_time"
                                            value={operationForm.revised_departure_time}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field">
                                        <label>Revised Arrival</label>
                                        <input
                                            type="time"
                                            name="revised_arrival_time"
                                            value={operationForm.revised_arrival_time}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field full-width">
                                        <label>Delay Reason</label>
                                        <textarea
                                            name="delay_reason"
                                            placeholder="Enter reason for delay..."
                                            value={operationForm.delay_reason}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                    <div className="operation-field full-width">
                                        <label>Cancellation Reason</label>
                                        <textarea
                                            name="cancellation_reason"
                                            placeholder="Enter cancellation reason..."
                                            value={operationForm.cancellation_reason}
                                            onChange={handleOperationChange}
                                        />
                                    </div>

                                </div>

                                {operationMessage && (
                                    <p className="operation-message">
                                        {operationMessage}
                                    </p>
                                )}

                                <div className="flight-editor-actions">
                                    <button
                                        type="button"
                                        className="operation-cancel-button"
                                        onClick={closeFlightEditor}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="operation-save-button"
                                        disabled={savingFlight}
                                    >
                                        <Save size={17} />
                                        {savingFlight ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}