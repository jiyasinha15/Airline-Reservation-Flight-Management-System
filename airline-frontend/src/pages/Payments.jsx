
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, Search, ArrowLeft, RefreshCw, Receipt
} from "lucide-react";
import "./Payments.css";

export default function Payments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:5000/api/admin/payments",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("aureliaToken")}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load payments.");
      }

      setPayments(data.payments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((payment) =>
    [
      payment.payment_id,
      payment.booking_id,
      payment.pnr,
      payment.passengerName,
      payment.payment_method,
      payment.payment_status,
      payment.transaction_reference,
    ].some((value) =>
      String(value || "").toLowerCase().includes(search.toLowerCase())
    )
  );

  const totalSuccessful = payments
    .filter((p) => p.payment_status === "SUCCESS")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const successfulCount = payments.filter(
    (p) => p.payment_status === "SUCCESS"
  ).length;

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleString("en-IN");
  };

  return (
    <div className="payments-page">
      <header className="payments-header">
        <button
          className="payment-back-btn"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft size={18} /> Dashboard
        </button>

        <div>
          <span className="payment-eyebrow">AURELIA AIR / ADMIN</span>
          <h1>Payments Management</h1>
          <p>Monitor payment transactions and revenue.</p>
        </div>

        <button className="payment-refresh-btn" onClick={loadPayments}>
          <RefreshCw size={17} /> Refresh
        </button>
      </header>

      <section className="payment-stats">
        <div className="payment-stat-card">
          <CreditCard size={25} />
          <div>
            <span>Total Transactions</span>
            <h2>{payments.length}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <Receipt size={25} />
          <div>
            <span>Successful Payments</span>
            <h2>{successfulCount}</h2>
          </div>
        </div>

        <div className="payment-stat-card">
          <CreditCard size={25} />
          <div>
            <span>Successful Revenue</span>
            <h2>₹{totalSuccessful.toLocaleString("en-IN")}</h2>
          </div>
        </div>
      </section>

      <section className="payment-content">
        <div className="payment-toolbar">
          <h2>All Transactions</h2>

          <div className="payment-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PNR, passenger or transaction..."
            />
          </div>
        </div>

        {loading ? (
          <p className="payment-message">Loading payments...</p>
        ) : error ? (
          <div className="payment-message payment-error">
            {error}
            <button onClick={loadPayments}>Try Again</button>
          </div>
        ) : (
          <div className="payment-table-wrapper">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>PAYMENT ID</th>
                  <th>PNR</th>
                  <th>PASSENGER</th>
                  <th>AMOUNT</th>
                  <th>METHOD</th>
                  <th>TRANSACTION REF</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td>#{payment.payment_id}</td>
                    <td className="payment-pnr">{payment.pnr}</td>
                    <td>
                      <strong>{payment.passengerName}</strong>
                      <small>{payment.passengerEmail}</small>
                    </td>
                    <td className="payment-amount">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>
                    <td>{payment.payment_method}</td>
                    <td>{payment.transaction_reference || "—"}</td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>
                      <span className={`payment-status ${String(payment.payment_status).toLowerCase()}`}>
                        {payment.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredPayments.length === 0 && (
              <p className="payment-message">
                {search ? "No matching transactions found." : "No payment records available."}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
