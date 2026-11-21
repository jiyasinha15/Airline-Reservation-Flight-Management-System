
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane, Plus, Search, ArrowLeft, RefreshCw,
  Pencil, Trash2, X
} from "lucide-react";
import "./AdminFlights.css";

const emptyFlight = {
  airline: "",
  flight_code: "",
  origin: "",
  destination: "",
  departure_time: "",
  arrival_time: "",
  price: "",
  available_seats: 180,

  status: "SCHEDULED",
  boarding_time: "",
  actual_departure_time: "",
  actual_arrival_time: "",
  revised_departure_time: "",
  revised_arrival_time: "",
  delay_reason: "",
  cancellation_reason: "",
};

export default function AdminFlights() {
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [form, setForm] = useState(emptyFlight);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("aureliaToken");

  const loadFlights = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/flights");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load flights.");
      }

      setFlights(data.flights || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlights();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm(emptyFlight);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const url = editingId
        ? `http://localhost:5000/api/admin/flights/${editingId}`
        : "http://localhost:5000/api/admin/flights";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,

          ...(editingId
            ? {
              boarding_time: form.boarding_time || null,
              actual_departure_time: form.actual_departure_time || null,
              actual_arrival_time: form.actual_arrival_time || null,
              revised_departure_time: form.revised_departure_time || null,
              revised_arrival_time: form.revised_arrival_time || null,
              delay_reason: form.delay_reason.trim() || null,
              cancellation_reason: form.cancellation_reason.trim() || null,
            }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save flight.");
      }

      setMessage(data.message);
      resetForm();
      await loadFlights();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (flight) => {
    setEditingId(flight.id);

    setForm({
      airline: flight.airline || "",
      flight_code: flight.flightCode || "",
      origin: flight.from || "",
      destination: flight.to || "",
      departure_time: String(flight.departureTime || "").slice(0, 5),
      arrival_time: String(flight.arrivalTime || "").slice(0, 5),
      price: String(flight.price ?? ""),
      available_seats: String(flight.availableSeats ?? 0),

      status: flight.status || "SCHEDULED",
      boarding_time: String(flight.boardingTime || "").slice(0, 5),
      actual_departure_time: String(flight.actualDepartureTime || "").slice(0, 5),
      actual_arrival_time: String(flight.actualArrivalTime || "").slice(0, 5),
      revised_departure_time: String(flight.revisedDepartureTime || "").slice(0, 5),
      revised_arrival_time: String(flight.revisedArrivalTime || "").slice(0, 5),
      delay_reason: flight.delayReason || "",
      cancellation_reason: flight.cancellationReason || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (flight) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete flight ${flight.flightCode}?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/flights/${flight.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to delete flight.");
      }

      setMessage(data.message);
      await loadFlights();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredFlights = flights.filter((flight) =>
    [
      flight.flightCode,
      flight.airline,
      flight.from,
      flight.to,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="admin-flights-page">
      <header className="af-header">
        <button
          className="af-secondary-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={17} /> Dashboard
        </button>

        <div>
          <span className="af-eyebrow">AURELIA AIR / ADMIN</span>
          <h1>Flight Management</h1>
          <p>Manage your airline flight schedules.</p>
        </div>

        <button className="af-secondary-btn" onClick={loadFlights}>
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      {error && <div className="af-alert error">{error}</div>}
      {message && <div className="af-alert success">{message}</div>}

      <section className="af-form-card">
        <div className="af-section-heading">
          <div>
            <span className="af-eyebrow">FLIGHT OPERATIONS</span>
            <h2>{editingId ? "Edit Flight" : "Add New Flight"}</h2>
          </div>

          {editingId && (
            <button className="af-cancel-btn" onClick={resetForm}>
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="af-form-grid">
            <label>
              Airline Name
              <input name="airline" value={form.airline}
                onChange={handleChange} required />
            </label>

            <label>
              Flight Code
              <input name="flight_code" value={form.flight_code}
                onChange={handleChange} required />
            </label>

            <label>
              Origin
              <input name="origin" value={form.origin}
                onChange={handleChange} required />
            </label>

            <label>
              Destination
              <input name="destination" value={form.destination}
                onChange={handleChange} required />
            </label>

            <label>
              Departure Time
              <input type="time" name="departure_time"
                value={form.departure_time}
                onChange={handleChange} required />
            </label>

            <label>
              Arrival Time
              <input type="time" name="arrival_time"
                value={form.arrival_time}
                onChange={handleChange} required />
            </label>

            <label>
              Ticket Price (₹)
              <input type="number" name="price" min="0.01"
                step="0.01" value={form.price}
                onChange={handleChange} required />
            </label>

            <label>
              Available Seats
              <input type="number" name="available_seats" min="0"
                step="1" value={form.available_seats}
                onChange={handleChange} required />
            </label>

            <label>
              Flight Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="BOARDING">Boarding</option>
                <option value="DELAYED">Delayed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DEPARTED">Departed</option>
                <option value="IN_AIR">In Air</option>
                <option value="ARRIVED">Arrived</option>
              </select>
            </label>

            <label>
              Boarding Time
              <input
                type="time"
                name="boarding_time"
                value={form.boarding_time}
                onChange={handleChange}
              />
            </label>

            <label>
              Revised Departure
              <input
                type="time"
                name="revised_departure_time"
                value={form.revised_departure_time}
                onChange={handleChange}
              />
            </label>

            <label>
              Revised Arrival
              <input
                type="time"
                name="revised_arrival_time"
                value={form.revised_arrival_time}
                onChange={handleChange}
              />
            </label>

            <label>
              Actual Departure
              <input
                type="time"
                name="actual_departure_time"
                value={form.actual_departure_time}
                onChange={handleChange}
              />
            </label>

            <label>
              Actual Arrival
              <input
                type="time"
                name="actual_arrival_time"
                value={form.actual_arrival_time}
                onChange={handleChange}
              />
            </label>

            <label>
              Delay Reason
              <input
                name="delay_reason"
                value={form.delay_reason}
                onChange={handleChange}
                placeholder="Enter delay reason"
              />
            </label>

            <label>
              Cancellation Reason
              <input
                name="cancellation_reason"
                value={form.cancellation_reason}
                onChange={handleChange}
                placeholder="Enter cancellation reason"
              />
            </label>
          </div>

          <button className="af-primary-btn" type="submit" disabled={saving}>
            {editingId ? <Pencil size={17} /> : <Plus size={17} />}
            {saving ? "Saving..." : editingId ? "Update Flight" : "Add Flight"}
          </button>
        </form>
      </section>

      <section className="af-table-card">
        <div className="af-table-heading">
          <div>
            <h2>All Flights</h2>
            <p>{flights.length} flights in database</p>
          </div>

          <div className="af-search">
            <Search size={17} />
            <input
              placeholder="Search flights..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="af-table-wrapper">
          <table className="af-table">
            <thead>
              <tr>
                <th>FLIGHT</th>
                <th>AIRLINE</th>
                <th>ROUTE</th>
                <th>DEPARTURE</th>
                <th>ARRIVAL</th>
                <th>PRICE</th>
                <th>SEATS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="af-empty">Loading flights...</td>
                </tr>
              ) : filteredFlights.length === 0 ? (
                <tr>
                  <td colSpan="8" className="af-empty">No flights found.</td>
                </tr>
              ) : (
                filteredFlights.map((flight) => (
                  <tr key={flight.id}>
                    <td className="af-flight-code">{flight.flightCode}</td>
                    <td>{flight.airline}</td>
                    <td>{flight.from} → {flight.to}</td>
                    <td>{flight.departureTime}</td>
                    <td>{flight.arrivalTime}</td>
                    <td>₹{Number(flight.price).toLocaleString("en-IN")}</td>
                    <td>{flight.availableSeats}</td>
                    <td>
                      <div className="af-actions">
                        <button
                          className="af-edit-btn"
                          title="Edit flight"
                          onClick={() => handleEdit(flight)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="af-delete-btn"
                          title="Delete flight"
                          onClick={() => handleDelete(flight)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
