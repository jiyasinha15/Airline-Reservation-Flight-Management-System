
import { useState, useEffect, useCallback, useMemo } from "react";

import {
  Search, Plane, MapPin, Clock, RefreshCw,
  Navigation, AlertCircle, Gauge, Activity
} from "lucide-react";

import {
  MapContainer, TileLayer, Marker, Popup,
  Polyline, useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./FlightTracker.css";
import { useLocation, useNavigate } from "react-router-dom";

// Aircraft marker
const planeIcon = new L.DivIcon({
  className: "plane-marker",
  html: '<div class="plane-marker-inner">✈</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21]
});

// Airport marker
const airportIcon = new L.DivIcon({
  className: "airport-marker",
  html: '<div class="airport-marker-inner"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11]
});

// Airport coordinates (latitude, longitude)
const airportCoordinates = {
  DEL: [28.5562, 77.1000],
  BOM: [19.0896, 72.8656],
  BLR: [13.1986, 77.7066],
  HYD: [17.2403, 78.4294],
  MAA: [12.9941, 80.1709],
  CCU: [22.6547, 88.4467],
  AMD: [23.0772, 72.6347],
  GOI: [15.3808, 73.8314],
  JAI: [26.8242, 75.8122],
  LKO: [26.7606, 80.8893],
  JFK: [40.6413, -73.7781],
  LHR: [51.4700, -0.4543],
  DXB: [25.2532, 55.3657],
  SIN: [1.3644, 103.9915],
  DOH: [25.2731, 51.6081],
  BKK: [13.6900, 100.7501],
  HKG: [22.3080, 113.9185],
  SYD: [-33.9399, 151.1753],
  CDG: [49.0097, 2.5479],
  FRA: [50.0379, 8.5622],
  SFO: [37.6213, -122.3790],
  LAX: [33.9416, -118.4085],
  ORD: [41.9742, -87.9073],
  YYZ: [43.6777, -79.6248]
};



// Automatically fit map to all available positions
function MapUpdater({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [55, 55] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 7);
    }
  }, [map, positions]);

  return null;
}

function formatDateTime(value) {
  if (!value) return "Not available";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

export default function FlightTracker() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flightNumber, setFlightNumber] = useState(
    location.state?.flightCode || ""
  );
  const [flight, setFlight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchFlight = useCallback(async (number, showLoader = true) => {
    if (!number) return;

    if (showLoader) setLoading(true);
    setError("");

    try {
      const isAureliaFlight = number.toUpperCase().startsWith("AU");

      const trackingURL = isAureliaFlight
        ? `http://localhost:5000/api/database-tracking/${encodeURIComponent(number)}`
        : `http://localhost:5000/api/live-tracking/${encodeURIComponent(number)}`;

      const response = await fetch(trackingURL);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Flight information not found.");
      }

      setFlight({
        ...data.flight,
        flightNumber:
          data.flight.flightNumber ||
          data.flight.flightCode ||
          number
      });
      setLastUpdated(new Date());

    } catch (err) {
      setError(err.message || "Unable to fetch flight information.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const code = location.state?.flightCode;

    if (code) {
      setFlightNumber(code);
      fetchFlight(code);
    }
  }, [location.state, fetchFlight]);

  const searchFlight = async (e) => {
    e.preventDefault();

    const number = flightNumber.trim().toUpperCase();

    if (!number) {
      setError("Please enter a flight number.");
      return;
    }

    setFlightNumber(number);
    setFlight(null);

    await fetchFlight(number);
  };



  const live = flight?.live;

  const hasCoordinates =
    live?.latitude != null &&
    live?.longitude != null &&
    Number.isFinite(Number(live.latitude)) &&
    Number.isFinite(Number(live.longitude));

  const position = hasCoordinates
    ? [Number(live.latitude), Number(live.longitude)]
    : null;

  // Get departure and arrival airport coordinates
  const departureCode = (
    flight?.departure?.iata ||
    flight?.departure?.airport ||
    ""
  ).toUpperCase();

  const arrivalCode = (
    flight?.arrival?.iata ||
    flight?.arrival?.airport ||
    ""
  ).toUpperCase();

  const departurePosition = departureCode
    ? airportCoordinates[departureCode] || null
    : null;

  const arrivalPosition = arrivalCode
    ? airportCoordinates[arrivalCode] || null
    : null;

  // Route line between airports
  const routePositions = useMemo(() => {
    if (departurePosition && arrivalPosition) {
      return [departurePosition, arrivalPosition];
    }

    return [];
  }, [departureCode, arrivalCode]);

  // All positions used to fit the map
  const mapPositions = useMemo(() => {
    return [
      departurePosition,
      arrivalPosition,
      position
    ].filter(Boolean);
  }, [
    departureCode,
    arrivalCode,
    live?.latitude,
    live?.longitude
  ]);

  const hasMapData = mapPositions.length > 0;

  const status = (flight?.status || "UNKNOWN").replaceAll("_", " ");

  return (
    <div className="tracker-page">

      <nav className="tracker-navbar">
        <a href="/" className="tracker-brand">
          <Plane size={25} />
          <span>AURELIA <b>AIR</b></span>
        </a>

        <button
          type="button"
          className="tracker-home"
          onClick={() => navigate("/user/dashboard")}
        >
          Back to Dashboard
        </button>
      </nav>

      <section className="tracker-hero">

        <div className="tracker-eyebrow">
          <span className="live-dot" />
          REAL-TIME FLIGHT TRACKING
        </div>

        <h1>
          Track Your <span>Flight</span>
        </h1>

        <p>
          Follow your flight status and latest available aircraft position.
        </p>

        <form className="tracker-search" onSubmit={searchFlight}>
          <Search size={21} />

          <input
            type="text"
            placeholder="Enter flight number (e.g. AI101)"
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

              <h2>{flight.flightNumber || flightNumber}</h2>

              <p>{flight.airline || "Airline information"}</p>
            </div>

            <span className="flight-status">
              {status}
            </span>
          </div>

          {/* Flight information cards */}
          <div className="tracker-info-grid">

            <div className="tracker-info-card">
              <MapPin />
              <span>Departure</span>

              <strong>
                {flight.departure?.airport || "Unknown"}
              </strong>

              <small>
                {departureCode || "N/A"}
                {flight.departure?.terminal
                  ? ` · Terminal ${flight.departure.terminal}`
                  : ""}
              </small>
            </div>

            <div className="tracker-info-card">
              <Navigation />
              <span>Arrival</span>

              <strong>
                {flight.arrival?.airport || "Unknown"}
              </strong>

              <small>
                {arrivalCode || "N/A"}
                {flight.arrival?.terminal
                  ? ` · Terminal ${flight.arrival.terminal}`
                  : ""}
              </small>
            </div>

            <div className="tracker-info-card">
              <Clock />
              <span>Departure Time</span>

              <strong>
                {flight.departure?.time
                  ? String(flight.departure.time).slice(0, 5)
                  : "Not available"}
              </strong>

              <small>Scheduled / estimated</small>
            </div>

            <div className="tracker-info-card">
              <Clock />
              <span>Arrival Time</span>

              <strong>
                {flight.arrival?.time
                  ? String(flight.arrival.time).slice(0, 5)
                  : "Not available"}
              </strong>

              <small>Scheduled / estimated</small>
            </div>

          </div>

          {/* ADMIN FLIGHT STATUS UPDATES */}
          <div className="tracker-admin-updates">

            <div className="tracker-admin-heading">
              <Activity size={21} />
              <div>
                <h2>Flight Operations Update</h2>
                <p>Latest information updated by Aurelia Air</p>
              </div>
            </div>

            <div className="tracker-admin-grid">

              <div className="tracker-admin-item">
                <span>Boarding Time</span>
                <strong>{flight.boardingTime || "Not announced"}</strong>
              </div>

              <div className="tracker-admin-item">
                <span>Actual Departure</span>
                <strong>
                  {flight.departure?.actual
                    ? formatDateTime(flight.departure.actual)
                    : "Not updated"}
                </strong>
              </div>

              <div className="tracker-admin-item">
                <span>Revised Departure</span>
                <strong>
                  {flight.departure?.estimated
                    ? formatDateTime(flight.departure.estimated)
                    : "Not revised"}
                </strong>
              </div>

              <div className="tracker-admin-item">
                <span>Revised Arrival</span>
                <strong>
                  {flight.arrival?.estimated
                    ? formatDateTime(flight.arrival.estimated)
                    : "Not revised"}
                </strong>
              </div>

              <div className="tracker-admin-item">
                <span>Actual Arrival</span>
                <strong>
                  {flight.arrival?.actual
                    ? formatDateTime(flight.arrival.actual)
                    : "Not updated"}
                </strong>
              </div>

            </div>

            {flight.status === "DELAYED" && (
              <div className="tracker-reason delay-reason">
                <strong>Delay Information</strong>
                <p>{flight.delayReason || "Delay reason not provided by admin."}</p>
              </div>
            )}

            {flight.status === "CANCELLED" && (
              <div className="tracker-reason cancelled-reason">
                <strong>Cancellation Information</strong>
                <p>
                  {flight.cancellationReason ||
                    "Cancellation reason not provided by admin."}
                </p>
              </div>
            )}

            <div className="tracker-admin-last-update">
              Last admin update:{" "}
              {flight.lastStatusUpdate
                ? formatDateTime(flight.lastStatusUpdate)
                : "Not available"}
            </div>

          </div>

          {/* Map heading */}
          <div className="tracker-map-heading">
            <div>
              <h2>Live Aircraft Location & Route</h2>

              <p>
                {hasCoordinates
                  ? "Showing the latest reported aircraft coordinates and airport route."
                  : "Showing airport route. Live aircraft coordinates are currently unavailable."}
              </p>
            </div>

            <button
              className="tracker-refresh"
              onClick={() => fetchFlight(flight.flightNumber)}
              disabled={loading}
              type="button"
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          </div>

          {/* Map */}
          {hasMapData ? (
            <>
              <div className="tracker-map">

                <MapContainer
                  center={position || departurePosition || arrivalPosition}
                  zoom={5}
                  scrollWheelZoom={true}
                  style={{ height: "100%", width: "100%" }}
                >

                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapUpdater positions={mapPositions} />

                  {/* Airport-to-airport route */}
                  {routePositions.length === 2 && (
                    <Polyline
                      positions={routePositions}
                      pathOptions={{
                        color: "#d9b56d",
                        weight: 4,
                        opacity: 0.85,
                        dashArray: "10 8"
                      }}
                    />
                  )}

                  {/* Departure airport */}
                  {departurePosition && (
                    <Marker
                      position={departurePosition}
                      icon={airportIcon}
                    >
                      <Popup>
                        <strong>Departure Airport</strong>
                        <br />
                        {flight.departure?.airport}
                        <br />
                        {departureCode}
                      </Popup>
                    </Marker>
                  )}

                  {/* Arrival airport */}
                  {arrivalPosition && (
                    <Marker
                      position={arrivalPosition}
                      icon={airportIcon}
                    >
                      <Popup>
                        <strong>Arrival Airport</strong>
                        <br />
                        {flight.arrival?.airport}
                        <br />
                        {arrivalCode}
                      </Popup>
                    </Marker>
                  )}

                  {/* Actual reported aircraft position */}
                  {position && (
                    <Marker
                      position={position}
                      icon={planeIcon}
                    >
                      <Popup>
                        <strong>{flight.flightNumber}</strong>
                        <br />
                        {status}
                        <br />
                        Latest reported aircraft position
                      </Popup>
                    </Marker>
                  )}

                </MapContainer>

              </div>

              {position && (
                <p className="tracker-coordinates">
                  Latitude: {Number(live.latitude).toFixed(5)}
                  {" | "}
                  Longitude: {Number(live.longitude).toFixed(5)}
                </p>
              )}

              {!departurePosition || !arrivalPosition ? (
                <p className="tracker-coordinates">
                  Airport coordinates are not available for one or both airports.
                </p>
              ) : null}

            </>
          ) : (
            <div className="tracker-no-map">
              <Plane size={35} />

              <strong>Map information unavailable</strong>

              <span>
                Neither airport coordinates nor live aircraft coordinates
                are available for this flight.
              </span>
            </div>
          )}

          {/* Live aircraft information */}
          <div className="tracker-live-grid">

            <div className="tracker-live-card">
              <Activity />
              <span>Altitude</span>

              <strong>
                {live?.altitude != null
                  ? `${Number(live.altitude).toLocaleString()} m`
                  : "GPS unavailable"}
              </strong>
            </div>

            <div className="tracker-live-card">
              <Gauge />
              <span>Speed</span>

              <strong>
                {live?.speed != null
                  ? `${live.speed} km/h`
                  : "GPS unavailable"}
              </strong>
            </div>

            <div className="tracker-live-card">
              <Navigation />
              <span>Direction</span>

              <strong>
                {live?.direction != null
                  ? `${live.direction}°`
                  : "GPS unavailable"}
              </strong>
            </div>

            <div className="tracker-live-card">
              <Plane />
              <span>Aircraft Model</span>
              <strong>
                {flight.aircraft?.model || "Not assigned"}
              </strong>
              <small>
                {flight.aircraft?.registration || ""}
              </small>
            </div>

          </div>

          <div className="tracker-update-info">
            <span>
              Last checked:{" "}
              {lastUpdated?.toLocaleTimeString("en-IN") || "N/A"}
            </span>

            <span>Refresh: Manual</span>
          </div>

        </section>
      )}

      <footer className="tracker-footer">
        AURELIA AIR · Flight information depends on external data availability.
      </footer>

    </div>
  );
}
