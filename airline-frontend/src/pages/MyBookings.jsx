
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import Barcode from "react-barcode";
import { useLocation } from "react-router-dom";
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
  Download,
  Armchair,
} from "lucide-react";
import "./MyBookings.css";

const API_URL = `${import.meta.env.VITE_API_URL}/api/bookings`;

function MyBookings() {
  const navigate = useNavigate();
  const location = useLocation();

  const fromDashboard =
    location.state?.from === "dashboard";
  const ticketRef = useRef(null);

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
      setError(err.message || "Unable to connect to the booking server.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "Not available";

    const str = String(value);

    // Avoid timezone shifting for DATE values like 2026-11-27
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const [year, month, day] = str.split("-").map(Number);
      const date = new Date(year, month - 1, day);

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    const date = new Date(str.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) return str;

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

  async function downloadTicket() {
    if (!ticketRef.current) return;

    const options = {
      margin: 8,
      filename: `Aurelia-Air-Ticket-${booking.pnr}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    try {
      await html2pdf().set(options).from(ticketRef.current).save();
    } catch (err) {
      console.error("PDF download failed:", err);
      setError("Unable to download ticket. Please try again.");
    }
  }

  return (
    <main className="my-bookings-page">
      <header className="my-bookings-header">
        <button
          className="my-bookings-back"
          onClick={() =>
            navigate(
              fromDashboard ? "/user/dashboard" : "/",
              { replace: true }
            )
          }
        >
          <ArrowLeft size={18} />
          {fromDashboard ? "Back to Dashboard" : "Homepage"}
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

        <form className="my-bookings-search" onSubmit={handleSearch}>
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
          <>
            <section className="my-booking-card" ref={ticketRef}>
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

              <div className="my-booking-barcode">
                <Barcode
                  value={booking.pnr}
                  format="CODE128"
                  width={1.8}
                  height={55}
                  displayValue={true}
                  fontSize={14}
                  background="#ffffff"
                  lineColor="#111827"
                  margin={8}
                />
                <p>SCAN BOOKING REFERENCE</p>
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
                    Travel date
                    <strong>{formatDate(booking.flightDate)}</strong>
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
                  <Armchair size={18} />
                  <span>
                    Seat number
                    <strong>{booking.seatNumbers || "Not assigned"}</strong>
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

              <div className="my-booking-fare-breakdown">
                <h3>Fare Breakdown</h3>

                <div className="my-booking-fare-row">
                  <span>Base Fare</span>
                  <strong>
                    ₹{Number(booking.price || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="my-booking-fare-row">
                  <span>Cabin Class ({booking.cabinClass || "Economy"})</span>
                  <strong>
                    ₹{Number(booking.cabinFare || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="my-booking-fare-row">
                  <span>Meal ({booking.mealType || "none"})</span>
                  <strong>
                    ₹{Number(booking.mealPrice || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="my-booking-fare-row my-booking-fare-total">
                  <span>Total Fare</span>
                  <strong>
                    ₹{Number(
                      booking.totalFare ??
                      (Number(booking.cabinFare || 0) + Number(booking.mealPrice || 0))
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <p className="my-booking-note">
                This is a database-backed project demonstration, not a real
                airline ticket or payment confirmation.
              </p>
            </section>

            <button
              className="my-booking-download"
              onClick={downloadTicket}
            >
              <Download size={19} />
              Download Ticket PDF
            </button>
          </>
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
