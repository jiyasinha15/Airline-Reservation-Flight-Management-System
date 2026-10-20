
import { useState } from "react";
import {
  Plane,
  ArrowRight,
  ArrowLeftRight,
  CalendarDays,
  Users,
  Search,
  ShieldCheck,
  Clock3,
  Headphones,
  Menu,
  X,
  Globe2,
  Luggage,
  ChevronDown,
  MapPin,
  Sparkles,
} from "lucide-react";
import "./index.css";
import { useNavigate } from "react-router-dom";

const destinations = [
  {
    city: "Dubai",
    country: "United Arab Emirates",
    code: "DXB",
    price: "₹14,999",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=85",
  },
  {
    city: "Singapore",
    country: "Singapore",
    code: "SIN",
    price: "₹18,499",
    image:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=85",
  },
  {
    city: "London",
    country: "United Kingdom",
    code: "LHR",
    price: "₹32,999",
    image:
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=900&q=85",
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    title: "Secure bookings",
    description: "Your booking details stay protected at every step.",
  },
  {
    icon: Clock3,
    title: "On-time journeys",
    description: "Plan your travel with a smooth booking experience.",
  },
  {
    icon: Headphones,
    title: "Here to help",
    description: "Support whenever you need a hand with your trip.",
  },
  {
    icon: Luggage,
    title: "Travel with ease",
    description: "Keep your journey details together in one place.",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [tripType, setTripType] = useState("round");
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState("BOM");
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [travelClass, setTravelClass] = useState("Economy");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString("en-CA");

  function swapCities() {
    setFrom(to);
    setTo(from);
  }

  function handleSearch(event) {
    event.preventDefault();

    if (from === to) {
      setNotice("Please choose two different cities.");
      return;
    }

    if (!departure) {
      setNotice("Please select your departure date.");
      return;
    }

    if (departure < today) {
      setNotice("Departure date cannot be in the past.");
      return;
    }

    if (tripType === "round" && !returnDate) {
      setNotice("Please select your return date.");
      return;
    }

    if (tripType === "round" && returnDate < departure) {
      setNotice("Return date must be on or after departure.");
      return;
    }

    navigate("/flights", {
      state: {
        from,
        to,
        departure,
        returnDate: tripType === "round" ? returnDate : "",
        tripType,
        passengers,
        travelClass,
      },
    });
  }

  return (
    <div className="site-shell" id="home">
      <div className="top-strip">
        <span>
          <Sparkles size={14} />
          A little more comfort in every journey
        </span>
        <span className="top-strip-right">
          Your journey, our priority
          <span className="gold-dot" />
        </span>
      </div>

      <header className="navbar">
        <a href="#home" className="brand">
          <span className="brand-mark">
            <Plane size={25} strokeWidth={1.7} />
          </span>
          <span className="brand-copy">
            <strong>AURELIA</strong>
            <small>A I R</small>
          </span>
        </a>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
          <a href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#destinations" onClick={() => setMenuOpen(false)}>Destinations</a>
          <a href="#benefits" onClick={() => setMenuOpen(false)}>Why Aurelia</a>
          <a href="#footer" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>

        <div className="nav-actions">
          <a className="login-link" href="#footer">Sign in</a>
          <a className="nav-button" href="#flight-search">
            Book a flight <ArrowRight size={16} />
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-image" />
          <div className="hero-overlay" />

          <div className="hero-content">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              THE ART OF TRAVEL
            </div>

            <h1>
              The world is
              <br />
              yours to <span>discover.</span>
            </h1>

            <p className="hero-description">
              Thoughtful journeys, exceptional comfort and beautiful
              destinations. Your next adventure starts here.
            </p>

            <div className="hero-buttons">
              <a href="#flight-search" className="gold-button">
                Explore flights <ArrowRight size={18} />
              </a>
              <a href="#destinations" className="text-button">
                Discover destinations <span>↗</span>
              </a>
            </div>

            <div className="hero-note">
              <span className="note-icon"><Globe2 size={17} /></span>
              <span>
                <strong>Your journey, beautifully planned.</strong>
                <small>From take-off to touchdown.</small>
              </span>
            </div>
          </div>

          <div className="hero-side-label">
            ELEVATE YOUR EVERY JOURNEY
          </div>

          <div className="hero-bottom">
            <span>01 — TRAVEL BEYOND ORDINARY</span>
            <span className="hero-scroll">SCROLL TO EXPLORE ↓</span>
          </div>
        </section>

        <section className="booking-section" id="flight-search">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR NEXT ADVENTURE</span>
              <h2>Where would you like to go?</h2>
            </div>
            <span className="booking-caption">
              <ShieldCheck size={16} /> Simple. Secure. Seamless.
            </span>
          </div>

          <form className="search-card" onSubmit={handleSearch}>
            <div className="trip-options">
              <button
                type="button"
                className={tripType === "round" ? "trip-option active" : "trip-option"}
                onClick={() => setTripType("round")}
              >
                <span className="trip-radio" />
                Round trip
              </button>
              <button
                type="button"
                className={tripType === "oneway" ? "trip-option active" : "trip-option"}
                onClick={() => setTripType("oneway")}
              >
                <span className="trip-radio" />
                One way
              </button>
              <span className="cabin-label">
                <Plane size={15} /> Flight booking
              </span>
            </div>

            <div className="search-fields">
              <label className="field city-field">
                <span className="field-label">FROM</span>
                <span className="field-value">
                  <MapPin size={17} />
                  <select value={from} onChange={(e) => setFrom(e.target.value)}>
                    <option value="DEL">Delhi (DEL)</option>
                    <option value="BOM">Mumbai (BOM)</option>
                    <option value="BLR">Bengaluru (BLR)</option>
                    <option value="HYD">Hyderabad (HYD)</option>
                    <option value="MAA">Chennai (MAA)</option>
                    <option value="CCU">Kolkata (CCU)</option>
                    <option value="DXB">Dubai (DXB)</option>
                    <option value="SIN">Singapore (SIN)</option>
                    <option value="LHR">London (LHR)</option>
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>

              <button
                type="button"
                className="swap-button"
                onClick={swapCities}
                aria-label="Swap departure and destination"
              >
                <ArrowLeftRight size={18} />
              </button>

              <label className="field city-field">
                <span className="field-label">TO</span>
                <span className="field-value">
                  <MapPin size={17} />
                  <select value={to} onChange={(e) => setTo(e.target.value)}>
                    <option value="BOM">Mumbai (BOM)</option>
                    <option value="DEL">Delhi (DEL)</option>
                    <option value="BLR">Bengaluru (BLR)</option>
                    <option value="HYD">Hyderabad (HYD)</option>
                    <option value="MAA">Chennai (MAA)</option>
                    <option value="CCU">Kolkata (CCU)</option>
                    <option value="DXB">Dubai (DXB)</option>
                    <option value="SIN">Singapore (SIN)</option>
                    <option value="LHR">London (LHR)</option>
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>

              <label className="field date-field">
                <span className="field-label">DEPARTURE</span>
                <span className="field-value">
                  <CalendarDays size={17} />
                  <input
                    type="date"
                    min={today}
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    required
                  />
                </span>
              </label>

              {tripType === "round" && (
                <label className="field date-field">
                  <span className="field-label">RETURN</span>
                  <span className="field-value">
                    <CalendarDays size={17} />
                    <input
                      type="date"
                      min={departure || today}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                    />
                  </span>
                </label>
              )}

              <label className="field passenger-field">
                <span className="field-label">TRAVELLERS</span>
                <span className="field-value">
                  <Users size={17} />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                  >
                    <option value="1">1 Traveller</option>
                    <option value="2">2 Travellers</option>
                    <option value="3">3 Travellers</option>
                    <option value="4">4 Travellers</option>
                    <option value="5">5 Travellers</option>
                    <option value="6">6 Travellers</option>
                    <option value="7">7 Travellers</option>
                    <option value="8">8 Travellers</option>
                    <option value="9">9 Travellers</option>
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>

              <label className="field class-field">
                <span className="field-label">CABIN CLASS</span>
                <span className="field-value">
                  <Plane size={17} />
                  <select
                    value={travelClass}
                    onChange={(e) => setTravelClass(e.target.value)}
                  >
                    <option>Economy</option>
                    <option>Premium Economy</option>
                    <option>Business</option>
                    <option>First Class</option>
                  </select>
                  <ChevronDown size={15} />
                </span>
              </label>
            </div>

            <div className="search-footer">
              <span className="search-hint">
                <ShieldCheck size={15} />
                No booking charges on this demo
              </span>
              <button className="search-button" type="submit">
                <Search size={18} /> Search flights
              </button>
            </div>

            {notice && (
              <div className="notice-message" role="status">
                {notice}
              </div>
            )}
          </form>
        </section>

        <section className="destinations-section" id="destinations">
          <div className="section-heading destination-heading">
            <div>
              <span className="section-kicker">CURATED FOR YOU</span>
              <h2>Places worth the journey.</h2>
              <p className="section-description">
                A little inspiration for wherever life takes you next.
              </p>
            </div>
            <a href="#flight-search" className="view-all">
              Plan your journey <ArrowRight size={17} />
            </a>
          </div>

          <div className="destination-grid">
            {destinations.map((destination, index) => (
              <article className="destination-card" key={destination.code}>
                <div className="destination-image-wrap">
                  <img
                    src={destination.image}
                    alt={`${destination.city} travel destination`}
                    className="destination-image"
                  />
                  <span className="destination-number">
                    0{index + 1}
                  </span>
                  <span className="destination-code">{destination.code}</span>
                </div>
                <div className="destination-info">
                  <div>
                    <h3>{destination.city}</h3>
                    <p>{destination.country}</p>
                  </div>
                  <div className="destination-price">
                    <small>FROM</small>
                    <strong>{destination.price}</strong>
                  </div>
                </div>
                <a
                  href="#flight-search"
                  className="destination-link"
                  onClick={() => {
                    setTo(destination.code);
                    setNotice("");
                  }}
                >
                  Explore destination <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
          <p className="price-disclaimer">
            * Sample fares for demonstration only. Actual fares will be
            provided by the flight search backend.
          </p>
        </section>

        <section className="benefits-section" id="benefits">
          <div className="benefits-intro">
            <span className="section-kicker">THE AURELIA DIFFERENCE</span>
            <h2>Every detail, designed around you.</h2>
            <p>
              Great travel is about more than reaching a destination.
              It is how you feel along the way.
            </p>
            <a href="#flight-search" className="benefits-link">
              Start your journey <ArrowRight size={17} />
            </a>
          </div>

          <div className="benefits-grid">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article className="benefit-card" key={title}>
                <span className="benefit-icon"><Icon size={23} /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="closing-banner">
          <div>
            <span className="section-kicker">THE WORLD AWAITS</span>
            <h2>Make room for wonderful.</h2>
            <p>Your next chapter could begin with a boarding pass.</p>
          </div>
          <a href="#flight-search" className="gold-button">
            Find your flight <ArrowRight size={18} />
          </a>
        </section>
      </main>

      <footer className="footer" id="footer">
        <div className="footer-main">
          <a href="#home" className="brand footer-brand">
            <span className="brand-mark">
              <Plane size={25} strokeWidth={1.7} />
            </span>
            <span className="brand-copy">
              <strong>AURELIA</strong>
              <small>A I R</small>
            </span>
          </a>
          <p>Travel beautifully. Arrive inspired.</p>
          <a href="#home" className="back-top">
            Back to top ↑
          </a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Aurelia Air</span>
          <span>Airline Reservation & Flight Management System</span>
          <span>Designed for journeys beyond ordinary.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
