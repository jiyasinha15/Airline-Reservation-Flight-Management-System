
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  ArrowLeft,
  Search,
  TicketCheck,
  Clock3,
  MapPin,
  CalendarDays,
  UserRound,
  ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/bookings";

function MyBookings() {
  const navigate = useNavigate();

  const [pnr, setPnr] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    const reference = pnr.trim().toUpperCase();

    if (!reference) {
      setError("Please enter your booking reference.");
      return;
    }

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(reference)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Booking not found.");
      }

      setBooking(data.booking);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the booking server."
      );
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(value) {
    if (!value) return "—";
    return String(value).slice(0, 5);
  }

  return (
    <main className="my-bookings-page">
      <header className="my-bookings-header">
        <button
          className="my-bookings-back"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={18} />
          Homepage
        </button>

        <div className="my-bookings-brand">
          <Plane size={25} />
          <span>AURELIA <small>AIR</small></span>
        </div>

        <span className="my-bookings-secure">
          <ShieldCheck size={16} /> Booking lookup
        </span>
      </header>

      <section className="my-bookings-content">
        <div className="my-bookings-intro">
          <span className="my-bookings-kicker">YOUR JOURNEY, YOUR WAY</span>
          <h1>My Bookings</h1>
          <p>
            Enter your booking reference to view your saved flight details.
          </p>
        </div>

        <form
          className="my-bookings-search"
          onSubmit={handleSearch}
        >
          <label htmlFor="booking-pnr">Booking reference (PNR)</label>

          <div className="my-bookings-search-row">
            <input
              id="booking-pnr"
              value={pnr}
              onChange={(event) =>
                setPnr(event.target.value.toUpperCase())
              }
              placeholder="e.g. AU12AB34"
              maxLength={20}
              autoComplete="off"
              required
            />

            <button type="submit" disabled={loading}>
              <Search size={17} />
              {loading ? "Searching..." : "Find booking"}
            </button>
          </div>
        </form>

        {error && (
          <div className="my-bookings-error" role="alert">
            {error}
          </div>
        )}

        {booking && (
          <section className="my-booking-card">
            <div className="my-booking-card-heading">
              <div className="my-booking-ticket-icon">
                <TicketCheck size={26} />
              </div>

              <div>
                <span className="my-bookings-kicker">
                  BOOKING REFERENCE
                </span>
                <h2>{booking.pnr}</h2>
              </div>

              <span className="my-booking-status">
                {booking.status}
              </span>
            </div>

            <div className="my-booking-airline">
              <Plane size={22} />
              <div>
                <strong>{booking.airline}</strong>
                <span>{booking.flightCode}</span>
              </div>
            </div>

            <div className="my-booking-route">
              <div>
                <span>FROM</span>
                <h3>{booking.origin}</h3>
                <strong>{formatTime(booking.departureTime)}</strong>
              </div>

              <div className="my-booking-route-middle">
                <span className="my-booking-route-line" />
                <Plane size={20} />
                <span className="my-booking-route-line" />
              </div>

              <div>
                <span>TO</span>
                <h3>{booking.destination}</h3>
                <strong>{formatTime(booking.arrivalTime)}</strong>
              </div>
            </div>

            <div className="my-booking-details">
              <div>
                <UserRound size={18} />
                <span>
                  Passenger
                  <strong>{booking.passengerName}</strong>
                </span>
              </div>

              <div>
                <CalendarDays size={18} />
                <span>
                  Booking date
                  <strong>{formatDate(booking.bookingDate)}</strong>
                </span>
              </div>

              <div>
                <MapPin size={18} />
                <span>
                  Route
                  <strong>
                    {booking.origin} → {booking.destination}
                  </strong>
                </span>
              </div>

              <div>
                <Clock3 size={18} />
                <span>
                  Flight time
                  <strong>
                    {formatTime(booking.departureTime)} –{" "}
                    {formatTime(booking.arrivalTime)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="my-booking-total">
              <span>Database fare per passenger</span>
              <strong>
                ₹{Number(booking.price).toLocaleString("en-IN")}
              </strong>
            </div>

            <p className="my-booking-note">
              This is a database-backed project demonstration, not a real
              airline ticket or payment confirmation.
            </p>
          </section>
        )}

        {!booking && !loading && !error && (
          <div className="my-bookings-empty">
            <TicketCheck size={40} />
            <h2>Find your journey</h2>
            <p>
              Your booking details will appear here after you enter a valid PNR.
            </p>
          </div>
        )}

        <button
          className="my-bookings-home-button"
          onClick={() => navigate("/")}
        >
          Back to homepage
        </button>
      </section>

      <footer className="my-bookings-footer">
        <Plane size={16} /> Aurelia Air · Travel beautifully.
      </footer>
    </main>
  );
}

export default MyBookings;
