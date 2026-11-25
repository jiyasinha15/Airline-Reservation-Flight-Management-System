
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    ArrowLeft,
    Clock3,
    Luggage,
    ArrowRight,
    RefreshCw,
    Users,
    Search,
    ArrowLeftRight
} from "lucide-react";
import "./Flights.css";

const API_URL = "http://localhost:5000/api/flights";
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

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

    const [airports, setAirports] = useState([]);

    const [sortBy, setSortBy] = useState("recommended");

    const [airlineFilter, setAirlineFilter] = useState("all");
    const [maxPrice, setMaxPrice] = useState(20000);
    const [departureFilter, setDepartureFilter] = useState("all");
    const [departureDate, setDepartureDate] = useState(
        search.departure || getTodayDate()
    );

    // AIRPORT SEARCH STATES
    const [fromAirport, setFromAirport] = useState(search.from || "");
    const [toAirport, setToAirport] = useState(search.to || "");

    const [appliedFrom, setAppliedFrom] = useState(search.from || "");
    const [appliedTo, setAppliedTo] = useState(search.to || "");

    const passengerCount = Math.max(
        1,
        Number(search.passengers || 1)
    );

    // FETCH FLIGHTS FROM DATABASE
    async function fetchFlights() {
        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams();

            params.set("date", departureDate);
            params.set("from", appliedFrom);
            params.set("to", appliedTo);
            params.set("passengers", String(passengerCount));

            console.log("SELECTED DATE:", search.departure);
            console.log("API REQUEST:", `${API_URL}?${params.toString()}`);


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

            console.log("FLIGHT DATA:", formattedFlights);
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
    }, [departureDate, passengerCount, appliedFrom, appliedTo]);

    // FETCH AIRPORTS FROM MYSQL DATABASE
    useEffect(() => {
        async function fetchAirports() {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/airports"
                );

                if (!response.ok) {
                    throw new Error("Unable to fetch airports");
                }

                const data = await response.json();

                setAirports(data.airports || []);

            } catch (error) {
                console.error("Airports loading error:", error);
            }
        }

        fetchAirports();
    }, []);

    // FILTER AND SORT FLIGHTS
    const filteredFlights = useMemo(() => {
        let result = [...flights];

        if (appliedFrom.trim()) {
            result = result.filter(
                (flight) =>
                    flight.from?.toUpperCase() ===
                    appliedFrom.trim().toUpperCase()
            );
        }

        if (appliedTo.trim()) {
            result = result.filter(
                (flight) =>
                    flight.to?.toUpperCase() ===
                    appliedTo.trim().toUpperCase()
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
        appliedFrom,
        appliedTo,
        passengerCount,
        sortBy,
        airlineFilter,
        maxPrice,
        departureFilter
    ]);

    // SEARCH BUTTON
    function handleAirportSearch() {
        setAppliedFrom(fromAirport);
        setAppliedTo(toAirport);
    }

    // SWAP AIRPORTS
    function swapAirports() {
        setFromAirport(toAirport);
        setToAirport(fromAirport);

        setAppliedFrom(toAirport);
        setAppliedTo(fromAirport);
    }

    // CLEAR AIRPORT SEARCH
    function clearAirportSearch() {
        setFromAirport("");
        setToAirport("");
        setAppliedFrom("");
        setAppliedTo("");
    }

    // SELECT FLIGHT

    function selectFlight(flight) {
        const updatedSearch = {
            ...search,
            from: appliedFrom,
            to: appliedTo,
            departure: departureDate
        };

        const bookingState = {
            search: updatedSearch,
            flight
        };

        const token = localStorage.getItem("aureliaToken");

        if (!token) {
            navigate("/login/user", {
                state: {
                    redirectTo: "/booking",
                    bookingState
                }
            });
            return;
        }

        navigate("/booking", {
            state: bookingState
        });
    }


    return (
        <div className="flights-page">

            <header className="flights-header">
                <button
                    className="back-button"
                    onClick={() => navigate("/user/dashboard")}
                >
                    <ArrowLeft size={18} />
                    Back to Dashboard
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

                {/* AIRPORT SEARCH SECTION */}

                <section className="flight-search-summary">

                    <div className="airport-search-field">
                        <span>FROM</span>

                        <select
                            value={fromAirport}
                            onChange={(e) => setFromAirport(e.target.value)}
                        >
                            <option value="">All Airports</option>

                            {airports.map((airport) => (
                                <option key={airport.code} value={airport.code}>
                                    {airport.city} ({airport.code})
                                </option>
                            ))}
                        </select>

                        {fromAirport && (
                            <small>
                                {airports.find(a => a.code === fromAirport)?.name}
                            </small>
                        )}
                    </div>

                    <button
                        className="swap-airports"
                        title="Swap airports"
                        onClick={swapAirports}
                    >
                        <ArrowLeftRight size={22} />
                    </button>

                    <div className="airport-search-field">
                        <span>TO</span>

                        <select
                            value={toAirport}
                            onChange={(e) => setToAirport(e.target.value)}
                        >
                            <option value="">All Destinations</option>

                            {airports.map((airport) => (
                                <option key={airport.code} value={airport.code}>
                                    {airport.city} ({airport.code})
                                </option>
                            ))}
                        </select>

                        {toAirport && (
                            <small>
                                {airports.find(a => a.code === toAirport)?.name}
                            </small>
                        )}
                    </div>

                    <div className="flight-date-field">
                        <span>DEPARTURE DATE</span>

                        <input
                            type="date"
                            value={departureDate}
                            min={getTodayDate()}
                            onChange={(e) => setDepartureDate(e.target.value)}
                        />
                    </div>

                    <div className="summary-info">
                        <Users size={17} />
                        <span>{passengerCount} Passenger(s)</span>
                    </div>

                    <button
                        className="airport-search-button"
                        onClick={handleAirportSearch}
                    >
                        <Search size={17} />
                        Search Flights
                    </button>

                    <button
                        className="airport-clear-button"
                        onClick={clearAirportSearch}
                    >
                        Clear
                    </button>

                </section>

                {/* FLIGHT TOOLBAR */}

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

                {/* FILTERS */}

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
                            max="70000"
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

                {/* LOADING */}

                {loading && (
                    <div className="flight-message">
                        <RefreshCw className="loading-icon" size={28} />
                        <p>Finding the best flights for you...</p>
                    </div>
                )}

                {/* ERROR */}

                {!loading && error && (
                    <div className="flight-message error-message">
                        <h3>Something went wrong</h3>
                        <p>{error}</p>

                        <button onClick={fetchFlights}>
                            <RefreshCw size={17} /> Try Again
                        </button>
                    </div>
                )}

                {/* NO FLIGHTS */}

                {!loading && !error && filteredFlights.length === 0 && (
                    <div className="flight-message">
                        <Plane size={35} />
                        <h3>No Flights Found</h3>

                        <p>
                            Is route par abhi koi flight available nahi hai,
                            ya selected passengers ke liye seats nahi hain.
                        </p>

                        <button onClick={clearAirportSearch}>
                            Clear Airport Search
                        </button>
                    </div>
                )}

                {/* FLIGHT CARDS */}

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
                                            <Luggage size={16} />
                                            15 kg Baggage Included
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
