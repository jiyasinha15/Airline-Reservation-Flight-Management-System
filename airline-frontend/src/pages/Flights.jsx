
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane,
    ArrowLeft,
    Clock3,
    Luggage,
    ArrowRight,
    ShieldCheck,
} from "lucide-react";

const demoFlights = [
    {
        id: 1,
        airline: "Aurelia Airways",
        code: "AU 201",
        departureTime: "06:30",
        arrivalTime: "08:45",
        duration: "2h 15m",
        stops: "Non-stop",
        price: 5499,
        baggage: "15 kg",
    },
    {
        id: 2,
        airline: "Skyline Airlines",
        code: "SK 418",
        departureTime: "10:15",
        arrivalTime: "12:40",
        duration: "2h 25m",
        stops: "Non-stop",
        price: 6299,
        baggage: "20 kg",
    },
    {
        id: 3,
        airline: "Royal Wings",
        code: "RW 105",
        departureTime: "15:20",
        arrivalTime: "18:10",
        duration: "2h 50m",
        stops: "1 stop",
        price: 4799,
        baggage: "15 kg",
    },
    {
        id: 4,
        airline: "Aurelia Airways",
        code: "AU 305",
        departureTime: "19:00",
        arrivalTime: "21:20",
        duration: "2h 20m",
        stops: "Non-stop",
        price: 6999,
        baggage: "20 kg",
    },
];

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

function Flights() {
    const navigate = useNavigate();
    const location = useLocation();
    const search = location.state;

    const [sortBy, setSortBy] = useState("recommended");
    const [selectedFlight, setSelectedFlight] = useState(null);

    if (!search) {
        return (
            <main className="flights-page">
                <div className="flight-empty">
                    <Plane size={42} />
                    <h2>Ready for take-off?</h2>
                    <p>Search for a journey to explore available demo flights.</p>
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

    const flights = [...demoFlights].sort((a, b) => {
        if (sortBy === "price") return a.price - b.price;
        if (sortBy === "duration") {
            return a.duration.localeCompare(b.duration);
        }
        return a.id - b.id;
    });

    const formatDate = (date) => {
        if (!date) return "Not selected";
        return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <main className="flights-page">
            <header className="flights-header">
                <button className="flight-back" onClick={() => navigate("/")}>
                    <ArrowLeft size={18} /> Homepage
                </button>

                <div className="flight-brand">
                    <Plane size={25} />
                    <span>AURELIA <small>AIR</small></span>
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
                            {search.tripType === "round" ? "Round trip" : "One way"}
                        </small>
                    </div>

                    <div>
                        <h1>{search.to}</h1>
                        <p>{cityNames[search.to] || search.to}</p>
                    </div>
                </div>

                <div className="flight-trip-details">
                    <span>Departure: <strong>{formatDate(search.departure)}</strong></span>
                    {search.tripType === "round" && (
                        <span>Return: <strong>{formatDate(search.returnDate)}</strong></span>
                    )}
                    <span>Travellers: <strong>{search.passengers}</strong></span>
                    <span>Class: <strong>{search.travelClass}</strong></span>
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
                        <span className="flight-kicker">HANDPICKED FOR YOUR TRIP</span>
                        <h2>Available flights</h2>
                        <p>Choose the flight that works best for you.</p>
                    </div>

                    <label className="flight-sort">
                        Sort by
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="recommended">Recommended</option>
                            <option value="price">Lowest price</option>
                            <option value="duration">Duration</option>
                        </select>
                    </label>
                </div>

                <div className="flight-demo-note">
                    <ShieldCheck size={17} />
                    Demonstration flights and sample fares — not live airline availability.
                </div>

                <div className="flight-list">
                    {flights.map((flight) => (
                        <article className="flight-card" key={flight.id}>
                            <div className="flight-airline">
                                <span className="flight-plane-icon"><Plane size={22} /></span>
                                <div>
                                    <strong>{flight.airline}</strong>
                                    <small>{flight.code}</small>
                                </div>
                            </div>

                            <div className="flight-timing">
                                <div>
                                    <strong>{flight.departureTime}</strong>
                                    <small>{search.from}</small>
                                </div>

                                <div className="flight-duration">
                                    <small><Clock3 size={13} /> {flight.duration}</small>
                                    <span />
                                    <small>{flight.stops}</small>
                                </div>

                                <div>
                                    <strong>{flight.arrivalTime}</strong>
                                    <small>{search.to}</small>
                                </div>
                            </div>

                            <div className="flight-baggage">
                                <Luggage size={17} />
                                <span>{flight.baggage} baggage</span>
                            </div>

                            <div className="flight-price">
                                <strong>₹{flight.price.toLocaleString("en-IN")}</strong>
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
                                    Select flight <ArrowRight size={15} />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>

                {selectedFlight && (
                    <div className="flight-selection" role="status">
                        <div>
                            <strong>{selectedFlight.airline} selected!</strong>
                            <p>
                                Demo fare: ₹{selectedFlight.price.toLocaleString("en-IN")}
                                {" "}per passenger. Booking details will be the next step.
                            </p>
                        </div>
                        <button
                            className="flight-back"
                            onClick={() => setSelectedFlight(null)}
                        >
                            Change flight
                        </button>
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
