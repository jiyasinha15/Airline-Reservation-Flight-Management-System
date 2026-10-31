
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, Search, ArrowLeft, RefreshCw,
  Mail, Phone, UserRound
} from "lucide-react";
import "./Passengers.css";

export default function Passengers() {
  const navigate = useNavigate();

  const [passengers, setPassengers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPassengers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/passengers",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load passengers.");
      }

      setPassengers(data.passengers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPassengers();
  }, []);

  const filteredPassengers = passengers.filter((passenger) =>
    [
      passenger.name,
      passenger.email,
      passenger.phone,
      String(passenger.id),
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="passengers-page">
      <header className="passengers-header">
        <button className="back-btn" onClick={() => navigate("/admin/dashboard")}>
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <p className="passengers-eyebrow">AURELIA AIR / ADMIN</p>
          <h1>Passenger Management</h1>
          <p>View and manage registered passengers.</p>
        </div>

        <button className="refresh-btn" onClick={loadPassengers}>
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      <section className="passenger-summary">
        <div className="passenger-summary-icon">
          <Users size={25} />
        </div>
        <div>
          <span>Total Passengers</span>
          <h2>{passengers.length}</h2>
        </div>
      </section>

      <section className="passenger-content">
        <div className="passenger-toolbar">
          <h2>All Passengers</h2>

          <div className="passenger-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone or ID..."
            />
          </div>
        </div>

        {loading ? (
          <p className="passenger-message">Loading passengers...</p>
        ) : error ? (
          <div className="passenger-message error-message">
            {error}
            <button onClick={loadPassengers}>Try Again</button>
          </div>
        ) : (
          <div className="passenger-table-wrapper">
            <table className="passenger-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Passenger</th>
                  <th>Contact</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Bookings</th>
                </tr>
              </thead>

              <tbody>
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id}>
                    <td>#{passenger.id}</td>
                    <td>
                      <div className="passenger-name">
                        <UserRound size={18} />
                        {passenger.name}
                      </div>
                    </td>
                    <td>
                      <div className="passenger-contact">
                        <span><Mail size={14} /> {passenger.email}</span>
                        <span><Phone size={14} /> {passenger.phone}</span>
                      </div>
                    </td>
                    <td>{passenger.age}</td>
                    <td>{passenger.gender}</td>
                    <td>{passenger.totalBookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPassengers.length === 0 && (
              <p className="passenger-message">
                {search ? "No matching passengers found." : "No passengers available yet."}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
