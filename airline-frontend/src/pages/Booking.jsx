
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plane,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";

import "./Booking.css";
import SeatSelection from "../components/SeatSelection";

const API_URL = `${import.meta.env.VITE_API_URL}`;

function Booking() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const flight = state?.flight;
  const search = state?.search;

  const passengerCount = Math.max(
    1,
    Number(search?.passengers || 1)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [seatNumbers, setSeatNumbers] = useState([]);
  const [cabinClass, setCabinClass] = useState(
    search?.travelClass || "Economy"
  );

  const [mealType, setMealType] = useState("none");

  const [passengers, setPassengers] = useState(() =>
    Array.from({ length: passengerCount }, () => ({
      name: "",
      age: "",
      gender: "",
      email: "",
      phone: ""
    }))
  );

  useEffect(() => {
    setPassengers(previous =>
      Array.from({ length: passengerCount }, (_, index) =>
        previous[index] || {
          name: "",
          age: "",
          gender: "",
          email: "",
          phone: ""
        }
      )
    );

    setSeatNumbers([]);
  }, [passengerCount]);

  const cabinMultipliers = {
    Economy: 1,
    "Premium Economy": 1.4,
    Business: 2.5,
    "First Class": 4,
  };

  const mealPrices = {
    none: 0,
    vegetarian: 300,
    nonVegetarian: 500,
  };

  const baseFare = Number(flight?.price || 0);

  const classFare = Math.round(
    baseFare * (cabinMultipliers[cabinClass] || 1)
  );

  const mealPrice = mealPrices[mealType] || 0;

  const perPassengerFare = classFare + mealPrice;

  const total = perPassengerFare * passengerCount;

  if (!flight || !search) {
    return (
      <main className="booking-page">
        <h2>No flight selected</h2>

        <button
          className="booking-button"
          onClick={() => navigate("/")}
        >
          Back to homepage
        </button>
      </main>
    );
  }

  function handleChange(index, event) {
    const { name, value } = event.target;

    setPassengers(previous =>
      previous.map((passenger, i) =>
        i === index
          ? { ...passenger, [name]: value }
          : passenger
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setError("");

    if (seatNumbers.length !== passengerCount) {
      setError(`Please select ${passengerCount} seat(s).`);
      return;
    }

    if (new Set(seatNumbers).size !== seatNumbers.length) {
      setError("Duplicate seat selection is not allowed.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
        },
        body: JSON.stringify({
          passengers,
          flightId: flight.id,
          seatNumbers,
          travelDate: search?.departure || search?.date || null,

          cabinClass,
          mealType,
          mealPrice,
          classFare,
          totalFare: total,
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Booking could not be saved."
        );
      }

      navigate("/payment", {
        state: {
          booking: data.booking,
          passengers,
          flight,
          search,
          selectedSeats: seatNumbers,
          cabinClass,
          mealType,
          mealPrice,
          classFare,
          perPassengerFare,
          total
        }
      });

    } catch (err) {
      console.error("Booking error:", err);

      setError(
        err.message || "Unable to connect to server."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="booking-page">

      <header className="booking-header">

        <button
          className="booking-back"
          onClick={() => navigate("/flights", { state: search })}
        >
          <ArrowLeft size={17} />
          Back to flights
        </button>

        <div className="booking-brand">
          <Plane size={23} />
          AURELIA <span>AIR</span>
        </div>

        <span className="booking-secure">
          <ShieldCheck size={16} />
          Secure booking
        </span>

      </header>

      <div className="booking-layout">

        <section className="passenger-panel">

          <span className="booking-kicker">
            ALMOST READY FOR TAKE-OFF
          </span>

          <h1>Select your seats</h1>

          <p className="booking-subtitle">
            Choose {passengerCount} seat(s) for your journey.
          </p>

          {/* DATABASE CONNECTED SEAT SELECTION */}

          <SeatSelection
            flightId={flight.id}
            passengerCount={passengerCount}
            onSeatsChange={setSeatNumbers}
          />

          {/* PASSENGER DETAILS */}

          <form
            onSubmit={handleSubmit}
            className="passenger-form"
          >

            <div className="passenger-card">
              <h3>Cabin Class & Meal</h3>

              <label>
                Cabin Class

                <select
                  value={cabinClass}
                  onChange={event => setCabinClass(event.target.value)}
                >
                  <option value="Economy">Economy</option>
                  <option value="Premium Economy">Premium Economy</option>
                  <option value="Business">Business</option>
                  <option value="First Class">First Class</option>
                </select>
              </label>

              <label>
                Meal Preference

                <select
                  value={mealType}
                  onChange={event => setMealType(event.target.value)}
                >
                  <option value="none">No Meal — ₹0</option>
                  <option value="vegetarian">Vegetarian Meal — ₹300</option>
                  <option value="nonVegetarian">
                    Non-Vegetarian Meal — ₹500
                  </option>
                </select>
              </label>

              <p>
                Meal charge: ₹{mealPrice.toLocaleString("en-IN")} per passenger
              </p>
            </div>

            <span className="booking-kicker">
              TRAVELLER INFORMATION
            </span>

            <h2>Passenger details</h2>

            {passengers.map((passenger, index) => (
              <div
                className="passenger-card"
                key={index}
              >

                <h3>Passenger {index + 1}</h3>

                <label>
                  Full name

                  <input
                    name="name"
                    value={passenger.name}
                    onChange={event => handleChange(index, event)}
                    placeholder="Enter full name"
                    required
                    maxLength={80}
                  />
                </label>

                <div className="booking-form-row">

                  <label>
                    Age

                    <input
                      name="age"
                      type="number"
                      min="1"
                      max="120"
                      value={passenger.age}
                      onChange={event => handleChange(index, event)}
                      placeholder="Age"
                      required
                    />
                  </label>

                  <label>
                    Gender

                    <select
                      name="gender"
                      value={passenger.gender}
                      onChange={event => handleChange(index, event)}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </label>

                </div>

                <label>
                  Email address

                  <input
                    name="email"
                    type="email"
                    value={passenger.email}
                    onChange={event => handleChange(index, event)}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label>
                  Phone number

                  <input
                    name="phone"
                    type="tel"
                    value={passenger.phone}
                    onChange={event => handleChange(index, event)}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{10}"
                    required
                  />
                </label>

              </div>
            ))}

            {error && (
              <p role="alert" className="booking-error">
                {error}
              </p>
            )}

            <button
              className="booking-button"
              type="submit"
              disabled={
                saving ||
                seatNumbers.length !== passengerCount
              }
            >
              {saving ? "Saving booking..." : "Continue to Payment"}
            </button>

            <p className="booking-disclaimer">
              Your booking and seat allocation will be
              validated by the server.
            </p>

          </form>

        </section>

        {/* FLIGHT SUMMARY */}

        <aside className="fare-panel">

          <span className="booking-kicker">
            YOUR FLIGHT
          </span>

          <h2>{flight.airline}</h2>

          <p className="fare-code">
            {flight.flightCode || flight.code}
          </p>

          <div className="fare-route">

            <div>
              <strong>{flight.departureTime}</strong>
              <span>{search.from}</span>
            </div>

            <Plane size={21} />

            <div>
              <strong>{flight.arrivalTime}</strong>
              <span>{search.to}</span>
            </div>

          </div>

          <div className="fare-detail">
            <span>Departure date</span>
            <strong>
              {search.departure || search.date || "Not specified"}
            </strong>
          </div>

          <div className="fare-detail">
            <span>Travellers</span>
            <strong>{passengerCount}</strong>
          </div>

          <div className="fare-detail">
            <span>Meal</span>
            <strong>
              {mealType === "none"
                ? "Not included"
                : mealType === "vegetarian"
                  ? "Vegetarian"
                  : "Non-Vegetarian"}
            </strong>
          </div>

          <div className="fare-detail">
            <span>Cabin fare</span>
            <strong>
              ₹{classFare.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="fare-detail">
            <span>Meal charge</span>
            <strong>
              ₹{(mealPrice * passengerCount).toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="fare-detail">
            <span>Cabin class</span>
            <strong>{cabinClass}</strong>
          </div>

          <div className="fare-detail">
            <span>Price per passenger</span>
            <strong>
              ₹{perPassengerFare.toLocaleString("en-IN")}
            </strong>
          </div>

          <div className="fare-detail">
            <span>Selected seats</span>
            <strong>
              {seatNumbers.length
                ? seatNumbers.join(", ")
                : "Not selected"}
            </strong>
          </div>

          <div className="fare-total">
            <span>Total fare</span>
            <strong>
              ₹{total.toLocaleString("en-IN")}
            </strong>
          </div>

          <p className="fare-note">
            Payment processing is handled on the next page.
          </p>

        </aside>

      </div>

    </main>
  );
}

export default Booking;