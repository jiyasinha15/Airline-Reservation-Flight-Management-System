
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    ArrowLeft,
    Clock3,
    Luggage,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/flights";

const cityNames = {
    DEL: "Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
    HYD: "Hyderabad",
    MAA: "Chennai",
    CCU: "Kolkata",
    DXB: "Dubai",
    SIN: "Singapore",
    LHR: "London",
};

function getDuration(departure, arrival) {
    if (!departure || !arrival) return "Not available";

    const toMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    let difference = toMinutes(arrival) - toMinutes(departure);

    // Account for flights arriving after midnight.
    if (difference < 0) difference += 24 * 60;

    const hours = Math.floor(difference / 60);
    const minutes = difference % 60;

    return `${hours}h ${minutes}m`;
}

function Flights() {
    const navigate = useNavigate();
    const location = useLocation();

    // Support both the original state and a nested search object.
    const search = location.state?.search || location.state;

    const [sortBy, setSortBy] = useState("recommended");
    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function fetchFlights() {
            setLoading(true);
            setError("");

            try {
                const response = await fetch(API_URL, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error("Unable to load flights from the server.");
                }

                const data = await response.json();

                if (!data.success || !Array.isArray(data.flights)) {
                    throw new Error("The server returned an invalid flight list.");
                }

                const formattedFlights = data.flights.map((flight) => ({
                    ...flight,
                    id: flight.id,
                    code:
                        flight.flightCode ||
                        flight.code ||
                        "Flight",
                    from: flight.from,
                    to: flight.to,
                    price: Number(flight.price),
                    duration: getDuration(
                        flight.departureTime,
                        flight.arrivalTime
                    ),
                    stops: flight.stops || "Not specified",
                    baggage: flight.baggage || "Not specified",
                }));

                setFlights(formattedFlights);
            } catch (err) {
                if (err.name !== "AbortError") {
                    console.error("Flight loading error:", err);
                    setError(
                        "Unable to connect to the flight server. Please check that your backend is running."
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchFlights();

        return () => controller.abort();
    }, []);

    const formatDate = (date) => {
        if (!date) return "Not selected";

        return new Date(`${date}T12:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "short",
                year: "numeric",
            }
        );
    };

    if (!search?.from || !search?.to) {
        return (
            <main className="flights-page">
                <div className="flight-empty">
                    <Plane size={42} />
                    <h2>Ready for take-off?</h2>
                    <p>Search for a journey to explore available flights.</p>
                    <button
                        className="flight-primary-button"
                        onClick={() => navigate("/")}
                    >
                        Back to homepage
                    </button>
                </div>
            </main>
        );
    }

    // Only show flights matching the requested route.
    const matchingFlights = flights.filter(
        (flight) =>
            flight.from?.toUpperCase() === search.from.toUpperCase() &&
            flight.to?.toUpperCase() === search.to.toUpperCase()
    );

    const sortedFlights = [...matchingFlights].sort((a, b) => {
        if (sortBy === "price") return a.price - b.price;

        if (sortBy === "duration") {
            const minutes = (duration) => {
                const match = duration.match(/(\d+)h\s+(\d+)m/);
                return match
                    ? Number(match[1]) * 60 + Number(match[2])
                    : Infinity;
            };

            return minutes(a.duration) - minutes(b.duration);
        }

        return a.id - b.id;
    });

    return (
        <main className="flights-page">
            <header className="flights-header">
                <button
                    className="flight-back"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft size={18} /> Homepage
                </button>

                <div className="flight-brand">
                    <Plane size={25} />
                    <span>
                        AURELIA <small>AIR</small>
                    </span>
                </div>

                <span className="flight-secure">
                    <ShieldCheck size={16} /> Secure journey
                </span>
            </header>

            <section className="flight-search-summary">
                <span className="flight-kicker">YOUR JOURNEY</span>

                <div className="flight-route">
                    <div>
                        <h1>{search.from}</h1>
                        <p>{cityNames[search.from] || search.from}</p>
                    </div>

                    <div className="flight-route-middle">
                        <Plane size={23} />
                        <span />
                        <small>
                            {search.tripType === "round"
                                ? "Round trip"
                                : "One way"}
                        </small>
                    </div>

                    <div>
                        <h1>{search.to}</h1>
                        <p>{cityNames[search.to] || search.to}</p>
                    </div>
                </div>

                <div className="flight-trip-details">
                    <span>
                        Departure:{" "}
                        <strong>{formatDate(search.departure)}</strong>
                    </span>

                    {search.tripType === "round" && (
                        <span>
                            Return:{" "}
                            <strong>{formatDate(search.returnDate)}</strong>
                        </span>
                    )}

                    <span>
                        Travellers: <strong>{search.passengers}</strong>
                    </span>

                    <span>
                        Class: <strong>{search.travelClass}</strong>
                    </span>
                </div>

                <button
                    className="flight-edit-search"
                    onClick={() => navigate("/")}
                >
                    Edit search
                </button>
            </section>

            <section className="flight-results">
                <div className="flight-results-heading">
                    <div>
                        <span className="flight-kicker">
                            HANDPICKED FOR YOUR TRIP
                        </span>
                        <h2>Available flights</h2>
                        <p>Choose the flight that works best for you.</p>
                    </div>

                    <label className="flight-sort">
                        Sort by
                        <select
                            value={sortBy}
                            onChange={(event) =>
                                setSortBy(event.target.value)
                            }
                        >
                            <option value="recommended">Recommended</option>
                            <option value="price">Lowest price</option>
                            <option value="duration">Duration</option>
                        </select>
                    </label>
                </div>

                <div className="flight-demo-note">
                    <ShieldCheck size={17} />
                    Database flights and sample fares — not live airline
                    availability.
                </div>

                {loading && (
                    <div className="flight-empty">
                        <p>Loading flights from Aurelia Air...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flight-empty" role="alert">
                        <Plane size={36} />
                        <h2>Flights unavailable</h2>
                        <p>{error}</p>
                        <button
                            className="flight-primary-button"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && sortedFlights.length === 0 && (
                    <div className="flight-empty">
                        <Plane size={36} />
                        <h2>No flights found</h2>
                        <p>
                            No flights are currently stored for{" "}
                            {search.from} to {search.to}. Try Delhi to Mumbai
                            or add this route to your database.
                        </p>
                        <button
                            className="flight-primary-button"
                            onClick={() => navigate("/")}
                        >
                            Change search
                        </button>
                    </div>
                )}

                {!loading && !error && sortedFlights.length > 0 && (
                    <div className="flight-list">
                        {sortedFlights.map((flight) => (
                            <article
                                className="flight-card"
                                key={flight.id}
                            >
                                <div className="flight-airline">
                                    <span className="flight-plane-icon">
                                        <Plane size={22} />
                                    </span>

                                    <div>
                                        <strong>{flight.airline}</strong>
                                        <small>{flight.code}</small>
                                    </div>
                                </div>

                                <div className="flight-timing">
                                    <div>
                                        <strong>{flight.departureTime}</strong>
                                        <small>{flight.from}</small>
                                    </div>

                                    <div className="flight-duration">
                                        <small>
                                            <Clock3 size={13} />{" "}
                                            {flight.duration}
                                        </small>
                                        <span />
                                        <small>{flight.stops}</small>
                                    </div>

                                    <div>
                                        <strong>{flight.arrivalTime}</strong>
                                        <small>{flight.to}</small>
                                    </div>
                                </div>

                                <div className="flight-baggage">
                                    <Luggage size={17} />
                                    <span>{flight.baggage} baggage</span>
                                </div>

                                <div className="flight-price">
                                    <strong>
                                        ₹{flight.price.toLocaleString("en-IN")}
                                    </strong>
                                    <small>per passenger</small>

                                    <button
                                        className="flight-primary-button"
                                        onClick={() =>
                                            navigate("/booking", {
                                                state: {
                                                    search,
                                                    flight,
                                                },
                                            })
                                        }
                                    >
                                        Select flight{" "}
                                        <ArrowRight size={15} />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            <footer className="flights-footer">
                <Plane size={17} /> Aurelia Air · Travel beautifully.
            </footer>
        </main>
    );
}

export default Flights;
