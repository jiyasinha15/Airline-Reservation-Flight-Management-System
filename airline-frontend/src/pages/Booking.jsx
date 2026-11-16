
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    ArrowLeft,
    ShieldCheck,
    Armchair,
    RefreshCw
} from "lucide-react";
import "./Booking.css";

const API_URL = "http://localhost:5000";

function Booking() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [seatsLoading, setSeatsLoading] = useState(true);
    const [seatError, setSeatError] = useState("");

    const flight = state?.flight;
    const search = state?.search;

    const passengerCount = Math.max(
        1,
        Number(search?.passengers || 1)
    );

    const [passengers, setPassengers] = useState(
        Array.from({ length: passengerCount }, () => ({
            name: "",
            age: "",
            gender: "",
            email: "",
            phone: "",
        }))
    );

    useEffect(() => {
        setPassengers((previous) =>
            Array.from({ length: passengerCount }, (_, index) =>
                previous[index] || {
                    name: "",
                    age: "",
                    gender: "",
                    email: "",
                    phone: "",
                }
            )
        );

        setSelectedSeats([]);
    }, [passengerCount]);



    const total = flight
        ? Number(flight.price) * passengerCount
        : 0;

    useEffect(() => {
        if (!flight?.id) return;

        async function fetchSeats() {
            try {
                setSeatsLoading(true);
                setSeatError("");

                const response = await fetch(
                    `${API_URL}/api/flights/${flight.id}/seats`
                );

                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.message || "Unable to load seats.");
                }

                setSeats(data.seats || []);

            } catch (err) {
                console.error("Seat loading error:", err);
                setSeatError(err.message || "Unable to load seats.");
            } finally {
                setSeatsLoading(false);
            }
        }

        fetchSeats();
    }, [flight?.id]);

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

        setPassengers((previous) =>
            previous.map((passenger, i) =>
                i === index
                    ? { ...passenger, [name]: value }
                    : passenger
            )
        );
    }

    function toggleSeat(seat) {
        if (seat.seat_status !== "AVAILABLE") return;

        setSelectedSeats((previous) => {
            if (previous.includes(seat.seat_number)) {
                return previous.filter(
                    (number) => number !== seat.seat_number
                );
            }

            if (previous.length >= passengerCount) {
                return previous;
            }

            return [...previous, seat.seat_number];
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        if (selectedSeats.length !== passengerCount) {
            setError(`Please select ${passengerCount} seat(s).`);
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/api/bookings`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    passengers,
                    flightId: flight.id,
                    seatNumbers: selectedSeats
                }),
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
                    selectedSeats,
                    total
                }
            });

        } catch (err) {
            console.error("Booking error:", err);
            setError(err.message || "Unable to connect to server.");
        } finally {
            setSaving(false);
        }
    }

    const seatRows = [];

    for (let i = 0; i < seats.length; i += 6) {
        seatRows.push(seats.slice(i, i + 6));
    }

    return (
        <main className="booking-page">

            <header className="booking-header">
                <button
                    className="booking-back"
                    onClick={() => navigate("/flights", { state: search })}
                >
                    <ArrowLeft size={17} /> Back to flights
                </button>

                <div className="booking-brand">
                    <Plane size={23} /> AURELIA <span>AIR</span>
                </div>

                <span className="booking-secure">
                    <ShieldCheck size={16} /> Secure booking
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

                    <section className="seat-selection-panel">

                        <div className="seat-panel-heading">
                            <div>
                                <h2>
                                    <Armchair size={21} /> Seat Selection
                                </h2>
                                <p>{flight.airline} · {flight.code}</p>
                            </div>
                        </div>

                        <div className="seat-legend">
                            <span><i className="available-dot"></i> Available</span>
                            <span><i className="selected-dot"></i> Selected</span>
                            <span><i className="booked-dot"></i> Booked</span>
                        </div>

                        {seatsLoading && (
                            <div className="seat-message">
                                <RefreshCw className="loading-icon" />
                                Loading available seats...
                            </div>
                        )}

                        {!seatsLoading && seatError && (
                            <div className="seat-message seat-error">
                                {seatError}
                            </div>
                        )}

                        {!seatsLoading && !seatError && (
                            <>
                                <div className="aircraft-label">
                                    FRONT OF AIRCRAFT
                                </div>

                                <div className="seat-map">

                                    {seatRows.map((row, index) => (
                                        <div className="seat-row" key={index}>

                                            <span className="row-number">
                                                {Math.floor(index) + 1}
                                            </span>

                                            {row.slice(0, 3).map((seat) => {
                                                const selected = selectedSeats.includes(
                                                    seat.seat_number
                                                );

                                                return (
                                                    <button
                                                        key={seat.seat_id}
                                                        type="button"
                                                        title={`${seat.seat_number} - ${seat.seat_type}`}
                                                        disabled={seat.seat_status === "BOOKED"}
                                                        className={`seat-button ${seat.seat_status === "BOOKED"
                                                            ? "booked"
                                                            : selected
                                                                ? "selected"
                                                                : "available"
                                                            }`}
                                                        onClick={() => toggleSeat(seat)}
                                                    >
                                                        {seat.seat_number}
                                                    </button>
                                                );
                                            })}

                                            <span className="seat-aisle"></span>

                                            {row.slice(3, 6).map((seat) => {
                                                const selected = selectedSeats.includes(
                                                    seat.seat_number
                                                );

                                                return (
                                                    <button
                                                        key={seat.seat_id}
                                                        type="button"
                                                        title={`${seat.seat_number} - ${seat.seat_type}`}
                                                        disabled={seat.seat_status === "BOOKED"}
                                                        className={`seat-button ${seat.seat_status === "BOOKED"
                                                            ? "booked"
                                                            : selected
                                                                ? "selected"
                                                                : "available"
                                                            }`}
                                                        onClick={() => toggleSeat(seat)}
                                                    >
                                                        {seat.seat_number}
                                                    </button>
                                                );
                                            })}

                                        </div>
                                    ))}

                                </div>

                                <div className="selected-seat-summary">
                                    <strong>
                                        Selected Seats ({selectedSeats.length}/{passengerCount})
                                    </strong>

                                    <p>
                                        {selectedSeats.length
                                            ? selectedSeats.join(", ")
                                            : "No seats selected yet"}
                                    </p>
                                </div>
                            </>
                        )}

                    </section>

                    <form onSubmit={handleSubmit} className="passenger-form">


                        <span className="booking-kicker">TRAVELLER INFORMATION</span>

                        <h2>Passenger details</h2>

                        {passengers.map((passenger, index) => (
                            <div className="passenger-card" key={index}>
                                <h3>Passenger {index + 1}</h3>

                                <label>
                                    Full name
                                    <input
                                        name="name"
                                        value={passenger.name}
                                        onChange={(event) => handleChange(index, event)}
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
                                            onChange={(event) => handleChange(index, event)}
                                            placeholder="Age"
                                            required
                                        />
                                    </label>

                                    <label>
                                        Gender
                                        <select
                                            name="gender"
                                            value={passenger.gender}
                                            onChange={(event) => handleChange(index, event)}
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
                                        onChange={(event) => handleChange(index, event)}
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
                                        onChange={(event) => handleChange(index, event)}
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
                                seatsLoading ||
                                !!seatError ||
                                selectedSeats.length !== passengerCount
                            }
                        >
                            {saving ? "Saving booking..." : "Continue to Payment"}
                        </button>

                        <p className="booking-disclaimer">
                            Selected seats will be confirmed after successful
                            server-side booking.
                        </p>

                    </form>

                </section>

                <aside className="fare-panel">

                    <span className="booking-kicker">YOUR FLIGHT</span>

                    <h2>{flight.airline}</h2>
                    <p className="fare-code">{flight.code}</p>

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
                        <strong>{search.departure || "Not specified"}</strong>
                    </div>

                    <div className="fare-detail">
                        <span>Travellers</span>
                        <strong>{passengerCount}</strong>
                    </div>

                    <div className="fare-detail">
                        <span>Cabin class</span>
                        <strong>{search.travelClass || "Economy"}</strong>
                    </div>

                    <div className="fare-detail">
                        <span>Price per passenger</span>
                        <strong>
                            ₹{Number(flight.price).toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div className="fare-detail">
                        <span>Selected seats</span>
                        <strong>
                            {selectedSeats.length
                                ? selectedSeats.join(", ")
                                : "Not selected"}
                        </strong>
                    </div>

                    <div className="fare-total">
                        <span>Total demo fare</span>
                        <strong>
                            ₹{total.toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <p className="fare-note">
                        Sample fare only. This page does not process payment.
                    </p>

                </aside>

            </div>
        </main>
    );
}

export default Booking;
