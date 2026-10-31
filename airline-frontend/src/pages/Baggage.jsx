
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Luggage, Search, ArrowLeft, RefreshCw, Plane
} from "lucide-react";
import "./Baggage.css";

export default function Baggage() {
  const navigate = useNavigate();

  const [baggage, setBaggage] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBaggage = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/baggage",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load baggage.");
      }

      setBaggage(data.baggage || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaggage();
  }, []);

  const filteredBaggage = baggage.filter((item) =>
    [
      item.baggage_tag,
      item.pnr,
      item.passengerName,
      item.baggage_type,
      item.baggage_status,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="baggage-page">
      <header className="baggage-header">
        <button
          className="baggage-back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <span className="baggage-eyebrow">AURELIA AIR / ADMIN</span>
          <h1>Baggage Management</h1>
          <p>Monitor passenger baggage and tracking status.</p>
        </div>

        <button className="baggage-refresh-btn" onClick={loadBaggage}>
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      <section className="baggage-stats">
        <div className="baggage-stat-card">
          <Luggage size={26} />
          <div>
            <span>Total Baggage</span>
            <h2>{baggage.length}</h2>
          </div>
        </div>

        <div className="baggage-stat-card">
          <Plane size={26} />
          <div>
            <span>Cabin Baggage</span>
            <h2>
              {baggage.filter((b) => b.baggage_type === "CABIN").length}
            </h2>
          </div>
        </div>

        <div className="baggage-stat-card">
          <Luggage size={26} />
          <div>
            <span>Checked Baggage</span>
            <h2>
              {baggage.filter((b) => b.baggage_type === "CHECKED").length}
            </h2>
          </div>
        </div>
      </section>

      <section className="baggage-content">
        <div className="baggage-toolbar">
          <h2>All Baggage Records</h2>

          <div className="baggage-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tag, PNR or passenger..."
            />
          </div>
        </div>

        {loading ? (
          <p className="baggage-message">Loading baggage records...</p>
        ) : error ? (
          <div className="baggage-message baggage-error">
            {error}
            <button onClick={loadBaggage}>Try Again</button>
          </div>
        ) : (
          <div className="baggage-table-wrapper">
            <table className="baggage-table">
              <thead>
                <tr>
                  <th>BAGGAGE ID</th>
                  <th>BAGGAGE TAG</th>
                  <th>PASSENGER</th>
                  <th>PNR</th>
                  <th>WEIGHT</th>
                  <th>TYPE</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {filteredBaggage.map((item) => (
                  <tr key={item.baggage_id}>
                    <td>#{item.baggage_id}</td>
                    <td className="baggage-tag">{item.baggage_tag}</td>
                    <td>{item.passengerName}</td>
                    <td>{item.pnr}</td>
                    <td>{Number(item.weight_kg).toFixed(2)} kg</td>
                    <td>
                      <span className="baggage-type">
                        {item.baggage_type}
                      </span>
                    </td>
                    <td>
                      <span className={`baggage-status ${String(item.baggage_status || "").toLowerCase()}`}>
                        {item.baggage_status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredBaggage.length === 0 && (
              <p className="baggage-message">
                {search ? "No matching baggage found." : "No baggage records available."}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
