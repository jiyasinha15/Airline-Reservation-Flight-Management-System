
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plane, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

function Booking() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [passenger, setPassenger] = useState({
        name: "",
        age: "",
        gender: "",
        email: "",
        phone: "",
    });

    const [confirmed, setConfirmed] = useState(false);
    const [pnr, setPnr] = useState("");

    if (!state?.flight || !state?.search) {
        return (
            <main className="booking-page">
                <h2>No flight selected</h2>

                <button className="booking-button" onClick={() => navigate("/")}>
                    Back to homepage
                </button>
            </main>
        );
    }

    const { flight, search } = state;
    const total = flight.price * Number(search.passengers);

    function handleChange(event) {
        setPassenger({
            ...passenger,
            [event.target.name]: event.target.value,
        });
    }


    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) return;

        setSaving(true);
        setError("");

        try {
            const response = await fetch("http://localhost:5000/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    passenger,
                    flightId: flight.id,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Booking could not be saved.");
            }

            setPnr(data.booking.pnr);
            setConfirmed(true);
        } catch (err) {
            console.error("Booking error:", err);
            setError(
                err.message || "Unable to connect to the server. Please try again."
            );
        } finally {
            setSaving(false);
        }
    }


    return (
        <main className="booking-page">
            <header className="booking-header">
                <button className="booking-back" onClick={() => navigate("/flights", { state: search })}>
                    <ArrowLeft size={17} /> Back to flights
                </button>

                <div className="booking-brand">
                    <Plane size={23} /> AURELIA <span>AIR</span>
                </div>

                <span className="booking-secure">
                    <ShieldCheck size={16} /> Secure demo
                </span>
            </header>

            {confirmed ? (
                <section className="booking-success">
                    <CheckCircle2 size={64} />
                    <span className="booking-kicker">BOOKING SAVED</span>
                    <h1>Your journey starts here!</h1>
                    <p>
                        Passenger details have been accepted for this demonstration.
                        This is not a real ticket.
                    </p>

                    <div className="pnr-box">
                        <small>DEMO BOOKING REFERENCE</small>
                        <strong>{pnr}</strong>
                        <span>{flight.airline} · {flight.code}</span>
                        <span>{search.from} → {search.to}</span>
                        <strong>₹{total.toLocaleString("en-IN")}</strong>
                    </div>

                    <button
                        className="booking-button"
                        onClick={() => navigate("/my-bookings")}
                    >
                        View My Bookings
                    </button>

                    <button className="booking-button" onClick={() => navigate("/")}>
                        Back to homepage
                    </button>
                </section>
            ) : (
                <div className="booking-layout">
                    <section className="passenger-panel">
                        <span className="booking-kicker">ALMOST READY FOR TAKE-OFF</span>
                        <h1>Passenger details</h1>
                        <p className="booking-subtitle">
                            Enter the traveller's details to continue with your demo booking.
                        </p>

                        <form onSubmit={handleSubmit} className="passenger-form">
                            <label>
                                Full name
                                <input
                                    name="name"
                                    value={passenger.name}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                    autoComplete="name"
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
                                        onChange={handleChange}
                                        placeholder="Age"
                                        required
                                    />
                                </label>

                                <label>
                                    Gender
                                    <select
                                        name="gender"
                                        value={passenger.gender}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </label>
                            </div>

                            <label>
                                Email address
                                <input
                                    name="email"
                                    type="email"
                                    value={passenger.email}
                                    onChange={handleChange}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </label>

                            <label>
                                Phone number
                                <input
                                    name="phone"
                                    type="tel"
                                    value={passenger.phone}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    autoComplete="tel"
                                    pattern="[0-9]{10}"
                                    title="Enter a 10-digit phone number"
                                    required
                                />
                            </label>

                            {error && (
                                <p role="alert" style={{ color: "#c62828" }}>
                                    {error}
                                </p>
                            )}

                            <button
                                className="booking-button"
                                type="submit"
                                disabled={saving}
                            >
                                {saving ? "Saving booking..." : "Confirm demo booking"}
                            </button>

                            <p className="booking-disclaimer">
                                Demo only: no payment is collected and no real ticket is issued.
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
                            <strong>{search.departure}</strong>
                        </div>
                        <div className="fare-detail">
                            <span>Travellers</span>
                            <strong>{search.passengers}</strong>
                        </div>
                        <div className="fare-detail">
                            <span>Cabin class</span>
                            <strong>{search.travelClass}</strong>
                        </div>
                        <div className="fare-detail">
                            <span>Price per passenger</span>
                            <strong>₹{flight.price.toLocaleString("en-IN")}</strong>
                        </div>

                        <div className="fare-total">
                            <span>Total demo fare</span>
                            <strong>₹{total.toLocaleString("en-IN")}</strong>
                        </div>
                        <p className="fare-note">
                            Sample fare only. This page does not process payment.
                        </p>
                    </aside>
                </div>
            )}
        </main>
    );
}

export default Booking;
