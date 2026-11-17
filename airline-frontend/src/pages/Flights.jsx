
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    ArrowLeft,
    Clock3,
    Luggage,
    ArrowRight,
    RefreshCw,
    Users
} from "lucide-react";
import "./Flights.css";

const API_URL = "http://localhost:5000/api/flights";

function getDuration(departure, arrival) {
    if (!departure || !arrival) return "N/A";

    const [dh, dm] = departure.split(":").map(Number);
    const [ah, am] = arrival.split(":").map(Number);

    let start = dh * 60 + dm;
    let end = ah * 60 + am;

    if (end < start) end += 24 * 60;

    const total = end - start;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
}

function formatTime(time) {
    if (!time) return "--:--";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
}

export default function Flights() {
    const location = useLocation();
    const navigate = useNavigate();

    const search = location.state?.search || location.state || {};

    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("recommended");

    const [airlineFilter, setAirlineFilter] = useState("all");
    const [maxPrice, setMaxPrice] = useState(20000);
    const [departureFilter, setDepartureFilter] = useState("all");

    const passengerCount = Math.max(
        1,
        Number(search.passengers || 1)
    );

    async function fetchFlights() {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            if (search.from) params.set("from", search.from);
            if (search.to) params.set("to", search.to);
            if (search.departure) params.set("date", search.departure);

            params.set("passengers", String(passengerCount));

            const response = await fetch(
                `${API_URL}?${params.toString()}`
            );

            if (!response.ok) {
                throw new Error("Unable to fetch flights");
            }

            const data = await response.json();

            const formattedFlights = (data.flights || []).map((flight) => ({
                ...flight,
                code: flight.flightCode,
                price: Number(flight.price),
                availableSeats: Number(flight.availableSeats)
            }));

            setFlights(formattedFlights);

        } catch (err) {
            console.error(err);
            setError("Flights load nahi ho paayi. Backend check karo.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFlights();
    }, [search.from, search.to, search.departure, passengerCount]);

    const filteredFlights = useMemo(() => {
        let result = [...flights];

        if (search.from) {
            result = result.filter(
                (flight) =>
                    flight.from?.toUpperCase() === search.from.toUpperCase()
            );
        }

        if (search.to) {
            result = result.filter(
                (flight) =>
                    flight.to?.toUpperCase() === search.to.toUpperCase()
            );
        }

        result = result.filter(
            (flight) => flight.availableSeats >= passengerCount
        );

        if (airlineFilter !== "all") {
            result = result.filter(
                (flight) => flight.airline === airlineFilter
            );
        }

        result = result.filter(
            (flight) => flight.price <= maxPrice
        );

        if (departureFilter !== "all") {
            result = result.filter((flight) => {
                const hour = Number(
                    flight.departureTime?.split(":")[0]
                );

                if (departureFilter === "morning") return hour >= 5 && hour < 12;
                if (departureFilter === "afternoon") return hour >= 12 && hour < 17;
                if (departureFilter === "evening") return hour >= 17 && hour < 21;
                if (departureFilter === "night") return hour >= 21 || hour < 5;

                return true;
            });
        }

        if (sortBy === "price") {
            result.sort((a, b) => a.price - b.price);

        } else if (sortBy === "duration") {
            const getMinutes = (flight) => {
                const [dh, dm] = flight.departureTime.split(":").map(Number);
                const [ah, am] = flight.arrivalTime.split(":").map(Number);

                let duration = (ah * 60 + am) - (dh * 60 + dm);

                return duration < 0 ? duration + 1440 : duration;
            };

            result.sort((a, b) => getMinutes(a) - getMinutes(b));

        } else {
            result.sort((a, b) =>
                a.departureTime.localeCompare(b.departureTime)
            );
        }

        return result;

    }, [
        flights,
        search.from,
        search.to,
        passengerCount,
        sortBy,
        airlineFilter,
        maxPrice,
        departureFilter
    ]);

    function selectFlight(flight) {
        navigate("/booking", {
            state: {
                search,
                flight
            }
        });
    }

    return (
        <div className="flights-page">

            <header className="flights-header">
                <button
                    className="back-button"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft size={18} />
                    Back to Home
                </button>

                <div className="flight-logo">
                    <Plane size={24} />
                    <span>AURELIA AIR</span>
                </div>
            </header>

            <main className="flights-container">

                <section className="flights-heading">
                    <span className="section-tag">
                        YOUR JOURNEY STARTS HERE
                    </span>

                    <h1>Available <span>Flights</span></h1>

                    <p>
                        Choose your preferred flight and get ready to fly.
                    </p>
                </section>

                <section className="flight-search-summary">
                    <div>
                        <span>FROM</span>
                        <h2>{search.from || "All Airports"}</h2>
                    </div>

                    <ArrowRight className="summary-arrow" />

                    <div>
                        <span>TO</span>
                        <h2>{search.to || "All Destinations"}</h2>
                    </div>

                    <div className="summary-info">
                        <Users size={17} />
                        <span>{passengerCount} Passenger(s)</span>
                    </div>

                    {search.departure && (
                        <div className="summary-info">
                            <span>{search.departure}</span>
                        </div>
                    )}
                </section>

                <section className="flight-toolbar">
                    <div>
                        <h2>Choose Your Flight</h2>
                        <p>
                            {loading
                                ? "Searching flights..."
                                : `${filteredFlights.length} flights available`}
                        </p>
                    </div>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recommended">Recommended</option>
                        <option value="price">Lowest Price</option>
                        <option value="duration">Shortest Duration</option>
                    </select>
                </section>

                <div className="flight-filters">

                    <select
                        value={airlineFilter}
                        onChange={(e) => setAirlineFilter(e.target.value)}
                    >
                        <option value="all">All Airlines</option>

                        {[...new Set(flights.map((f) => f.airline))].map((airline) => (
                            <option key={airline} value={airline}>
                                {airline}
                            </option>
                        ))}
                    </select>

                    <select
                        value={departureFilter}
                        onChange={(e) => setDepartureFilter(e.target.value)}
                    >
                        <option value="all">Any Departure</option>
                        <option value="morning">Morning (5 AM–12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM–5 PM)</option>
                        <option value="evening">Evening (5 PM–9 PM)</option>
                        <option value="night">Night (9 PM–5 AM)</option>
                    </select>

                    <label className="price-filter">
                        Maximum Price: ₹{maxPrice.toLocaleString("en-IN")}

                        <input
                            type="range"
                            min="1000"
                            max="20000"
                            step="500"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                        />
                    </label>

                    <button
                        className="reset-filters"
                        onClick={() => {
                            setAirlineFilter("all");
                            setDepartureFilter("all");
                            setMaxPrice(20000);
                            setSortBy("recommended");
                        }}
                    >
                        Reset Filters
                    </button>

                </div>

                {loading && (
                    <div className="flight-message">
                        <RefreshCw className="loading-icon" size={28} />
                        <p>Finding the best flights for you...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flight-message error-message">
                        <h3>Something went wrong</h3>
                        <p>{error}</p>

                        <button onClick={fetchFlights}>
                            <RefreshCw size={17} /> Try Again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredFlights.length === 0 && (
                    <div className="flight-message">
                        <Plane size={35} />
                        <h3>No Flights Found</h3>

                        <p>
                            Is route par abhi koi flight available nahi hai,
                            ya selected passengers ke liye seats nahi hain.
                        </p>

                        <button onClick={() => navigate("/")}>
                            Search Again
                        </button>
                    </div>
                )}

                {!loading && !error && filteredFlights.length > 0 && (
                    <div className="flight-list">

                        {filteredFlights.map((flight) => (
                            <article className="flight-card" key={flight.id}>

                                <div className="flight-card-top">
                                    <div className="airline-info">
                                        <div className="airline-icon">
                                            <Plane size={23} />
                                        </div>

                                        <div>
                                            <h3>{flight.airline}</h3>
                                            <span>{flight.code}</span>
                                        </div>
                                    </div>

                                    <span className={`flight-status ${flight.status?.toLowerCase()}`}>
                                        {flight.status}
                                    </span>
                                </div>

                                <div className="flight-route">

                                    <div className="route-point">
                                        <h2>{formatTime(flight.departureTime)}</h2>
                                        <h3>{flight.from}</h3>
                                        <span>Departure</span>
                                    </div>

                                    <div className="route-middle">
                                        <span>
                                            <Clock3 size={14} />
                                            {getDuration(
                                                flight.departureTime,
                                                flight.arrivalTime
                                            )}
                                        </span>

                                        <div className="route-line">
                                            <span></span>
                                            <Plane size={19} />
                                            <span></span>
                                        </div>

                                        <small>Direct Flight</small>
                                    </div>

                                    <div className="route-point route-destination">
                                        <h2>{formatTime(flight.arrivalTime)}</h2>
                                        <h3>{flight.to}</h3>
                                        <span>Arrival</span>
                                    </div>

                                </div>

                                <div className="flight-card-bottom">

                                    <div className="flight-features">
                                        <span>
                                            <Luggage size={16} /> Baggage
                                        </span>

                                        <span>
                                            <Users size={16} />
                                            {flight.availableSeats} Seats Left
                                        </span>
                                    </div>

                                    <div className="flight-price">
                                        <span>Price per passenger</span>

                                        <h2>
                                            ₹{flight.price.toLocaleString("en-IN")}
                                        </h2>

                                        <button
                                            onClick={() => selectFlight(flight)}
                                            disabled={flight.availableSeats < passengerCount}
                                        >
                                            Select Flight <ArrowRight size={17} />
                                        </button>
                                    </div>

                                </div>

                            </article>
                        ))}

                    </div>
                )}

            </main>
        </div>
    );
}