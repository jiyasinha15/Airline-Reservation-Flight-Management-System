
import { useState } from "react";
import {
  Search, Plane, MapPin, Clock, RefreshCw,
  Navigation, AlertCircle
} from "lucide-react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./FlightTracker.css";

const planeIcon = new L.DivIcon({
  className: "plane-marker",
  html: '<div class="plane-marker-inner">✈</div>',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

export default function FlightTracker() {
  const [flightNumber, setFlightNumber] = useState("");
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchFlight = async (e) => {
    e.preventDefault();

    const number = flightNumber.trim().toUpperCase();

    if (!number) {
      setError("Please enter a flight number.");
      return;
    }

    setLoading(true);
    setError("");
    setFlight(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/track-flight/${encodeURIComponent(number)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Flight information not found.");
      }

      setFlight(data.flight || data);
    } catch (err) {
      setError(err.message || "Unable to fetch flight information.");
    } finally {
      setLoading(false);
    }
  };

  const hasCoordinates =
    flight?.lat != null &&
    flight?.lng != null &&
    Number.isFinite(Number(flight.lat)) &&
    Number.isFinite(Number(flight.lng));

  const position = hasCoordinates
    ? [Number(flight.lat), Number(flight.lng)]
    : null;

  return (
    <div className="tracker-page">
      <nav className="tracker-navbar">
        <a href="/home" className="tracker-brand">
          <Plane size={25} />
          <span>AURELIA <b>AIR</b></span>
        </a>

        <a href="/home" className="tracker-home">Home</a>
      </nav>

      <section className="tracker-hero">
        <div className="tracker-eyebrow">
          <span className="live-dot" />
          FLIGHT TRACKING
        </div>

        <h1>Track Your <span>Flight</span></h1>
        <p>
          Search your flight number and check its latest available
          flight information.
        </p>

        <form className="tracker-search" onSubmit={searchFlight}>
          <Search size={21} />

          <input
            type="text"
            placeholder="Enter flight number (e.g. AI202)"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Track Flight"}
          </button>
        </form>

        {error && (
          <div className="tracker-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </section>

      {flight && (
        <section className="tracker-results">
          <div className="tracker-result-heading">
            <div>
              <span className="result-label">FLIGHT DETAILS</span>
              <h2>{flight.flight_iata || flight.flightNumber || flightNumber.toUpperCase()}</h2>
              <p>{flight.airline_name || flight.airline || "Airline information"}</p>
            </div>

            <span className="flight-status">
              {flight.status || "Information available"}
            </span>
          </div>

          <div className="tracker-info-grid">
            <div className="tracker-info-card">
              <MapPin />
              <span>Departure</span>
              <strong>
                {flight.dep_iata || flight.origin || "Not available"}
              </strong>
              <small>{flight.dep_city || ""}</small>
            </div>

            <div className="tracker-info-card">
              <Navigation />
              <span>Arrival</span>
              <strong>
                {flight.arr_iata || flight.destination || "Not available"}
              </strong>
              <small>{flight.arr_city || ""}</small>
            </div>

            <div className="tracker-info-card">
              <Clock />
              <span>Departure Time</span>
              <strong>
                {flight.dep_time || flight.departure || "Not available"}
              </strong>
            </div>

            <div className="tracker-info-card">
              <Clock />
              <span>Arrival Time</span>
              <strong>
                {flight.arr_time || flight.arrival || "Not available"}
              </strong>
            </div>
          </div>

          <div className="tracker-map-heading">
            <div>
              <h2>Flight Location</h2>
              <p>
                {hasCoordinates
                  ? "Latest coordinates returned by the flight data provider."
                  : "Live aircraft coordinates are not available for this result."}
              </p>
            </div>
            <RefreshCw size={20} />
          </div>

          {hasCoordinates ? (
            <div className="tracker-map">
              <MapContainer
                center={position}
                zoom={6}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={position} icon={planeIcon}>
                  <Popup>
                    {flight.flight_iata || flightNumber.toUpperCase()}
                    <br />
                    Latest available aircraft position
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          ) : (
            <div className="tracker-no-map">
              <Plane size={35} />
              <strong>Aircraft location unavailable</strong>
              <span>
                The provider returned flight information without live
                latitude and longitude.
              </span>
            </div>
          )}

          {hasCoordinates && (
            <p className="tracker-coordinates">
              Latitude: {Number(flight.lat).toFixed(4)} |
              Longitude: {Number(flight.lng).toFixed(4)}
            </p>
          )}
        </section>
      )}

      <footer className="tracker-footer">
        AURELIA AIR · Flight information depends on external data availability.
      </footer>
    </div>
  );
}
