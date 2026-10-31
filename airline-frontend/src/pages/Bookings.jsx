
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket, Search, ArrowLeft, RefreshCw, Plane
} from "lucide-react";
import "./Bookings.css";

export default function Bookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/bookings",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load bookings.");
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const filteredBookings = bookings.filter((booking) =>
    [
      booking.pnr,
      booking.passengerName,
      booking.flightCode,
      booking.passengerEmail,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN");
  };

  return (
    <div className="bookings-page">
      <header className="bookings-header">
        <button
          className="booking-back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <span className="booking-eyebrow">AURELIA AIR / ADMIN</span>
          <h1>Booking Management</h1>
          <p>Monitor reservations and passenger journeys.</p>
        </div>

        <button className="booking-refresh-btn" onClick={loadBookings}>
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      <section className="booking-summary">
        <Ticket size={26} />
        <div>
          <span>Total Bookings</span>
          <h2>{bookings.length}</h2>
        </div>
      </section>

      <section className="booking-content">
        <div className="booking-toolbar">
          <h2>All Reservations</h2>

          <div className="booking-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PNR, passenger or flight..."
            />
          </div>
        </div>

        {loading ? (
          <p className="booking-message">Loading bookings...</p>
        ) : error ? (
          <p className="booking-message booking-error">
            {error}
            <button onClick={loadBookings}>Try Again</button>
          </p>
        ) : (
          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>PNR</th>
                  <th>Passenger</th>
                  <th>Flight</th>
                  <th>Route</th>
                  <th>Booking Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="booking-pnr">{booking.pnr}</td>
                    <td>
                      <strong>{booking.passengerName}</strong>
                      <small>{booking.passengerEmail}</small>
                    </td>
                    <td>
                      <span className="booking-flight">
                        <Plane size={15} />
                        {booking.flightCode}
                      </span>
                      <small>{booking.airline}</small>
                    </td>
                    <td>{booking.origin} → {booking.destination}</td>
                    <td>{formatDate(booking.bookingDate)}</td>
                    <td>₹{Number(booking.price).toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`booking-status ${String(booking.status).toLowerCase()}`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBookings.length === 0 && (
              <p className="booking-message">
                {search ? "No matching bookings found." : "No bookings available."}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
