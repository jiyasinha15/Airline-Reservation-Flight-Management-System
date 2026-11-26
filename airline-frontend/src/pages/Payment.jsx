import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Plane, ArrowLeft, ShieldCheck, CreditCard,
    Smartphone, Landmark
} from "lucide-react";
import "./Payment.css";

export default function Payment() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [method, setMethod] = useState("UPI");
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    if (!state?.booking) {
        return (
            <main className="checkout-page">
                <h2>Booking details not found</h2>
                <button onClick={() => navigate("/flights")}>
                    Back to Flights
                </button>
            </main>
        );
    }

    const {
        booking,
        flight,
        search,
        total,
        cabinClass = "Economy",
        mealType = "none",
        mealPrice = 0,
        classFare = Number(flight?.price || 0),
        perPassengerFare = Number(flight?.price || 0),
    } = state;

    const passengerCount = Number(
        search?.passengers || booking?.passengerCount || 1
    );

    const mealLabel =
        mealType === "vegetarian"
            ? "Vegetarian Meal"
            : mealType === "nonVegetarian"
                ? "Non-Vegetarian Meal"
                : "No Meal";

    async function handlePayment(simulateFailure = false) {
        if (processing) return;

        setProcessing(true);
        setError("");
        setResult(null);

        try {
            console.log("PAYMENT DATA:", {
                bookingId: booking?.id,
                paymentMethod: method,
                passengerCount: booking?.passengerCount,
                booking
            });
            const response = await fetch("${import.meta.env.VITE_API_URL}/api/payments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    bookingId: booking.id,
                    paymentMethod: method,
                    passengerCount: Number(booking.passengerCount),
                    simulateFailure,

                    cabinClass,
                    mealType,
                    mealPrice,
                    classFare,
                    totalFare: total,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Payment failed.");
            }

            setResult(data.payment);
        } catch (err) {
            setError(err.message || "Unable to process payment.");
        } finally {
            setProcessing(false);
        }
    }

    return (
        <main className="checkout-page">
            <header className="checkout-header">
                <button onClick={() => navigate("/booking")} className="checkout-back">
                    <ArrowLeft size={18} /> Back
                </button>

                <div className="checkout-brand">
                    <Plane size={23} /> AURELIA <span>AIR</span>
                </div>

                <span className="checkout-secure">
                    <ShieldCheck size={16} /> Secure Demo
                </span>
            </header>

            <div className="checkout-layout">
                <section className="checkout-main">
                    <span className="checkout-eyebrow">COMPLETE YOUR JOURNEY</span>
                    <h1>Payment Details</h1>
                    <p className="checkout-subtitle">
                        Select a payment method for your demonstration booking.
                    </p>

                    <div className="checkout-methods">
                        <button
                            className={`checkout-method ${method === "UPI" ? "active" : ""}`}
                            onClick={() => setMethod("UPI")}
                        >
                            <Smartphone />
                            <span>UPI</span>
                            <small>Demo option</small>
                        </button>

                        <button
                            className={`checkout-method ${method === "CARD" ? "active" : ""}`}
                            onClick={() => setMethod("CARD")}
                        >
                            <CreditCard />
                            <span>Card</span>
                            <small>Demo option</small>
                        </button>

                        <button
                            className={`checkout-method ${method === "NET_BANKING" ? "active" : ""}`}
                            onClick={() => setMethod("NET_BANKING")}
                        >
                            <Landmark />
                            <span>Net Banking</span>
                            <small>Demo option</small>
                        </button>
                    </div>

                    <div className="checkout-selected">
                        <h3>{method === "UPI" ? "UPI Payment" : method === "CARD" ? "Card Payment" : "Net Banking"}</h3>
                        <p>
                            Selected method: <strong>{method.replace("_", " ")}</strong>
                        </p>
                        <p className="checkout-demo-note">
                            This is a demonstration interface. Do not enter real banking or card details.
                        </p>
                    </div>

                    {!result ? (
                        <>
                            <button
                                className="checkout-pay-btn"
                                onClick={() => handlePayment(false)}
                                disabled={processing}
                            >
                                {processing ? "Processing..." : "Simulate Payment Success"}
                            </button>

                            <button
                                className="checkout-pay-btn"
                                style={{
                                    marginTop: "12px",
                                    background: "#a94442",
                                    color: "white",
                                }}
                                onClick={() => handlePayment(true)}
                                disabled={processing}
                            >
                                Simulate Payment Failure
                            </button>
                        </>
                    ) : (
                        <div className="checkout-selected">
                            <h3>
                                {result.paymentStatus === "SUCCESS"
                                    ? "Payment Successful!"
                                    : "Payment Failed"}
                            </h3>

                            <p>Transaction ID: {result.transactionReference}</p>
                            <p>Payment Status: {result.paymentStatus}</p>

                            {result.paymentStatus === "SUCCESS" ? (
                                <button
                                    className="checkout-pay-btn"
                                    onClick={() => navigate("/my-bookings")}
                                >
                                    View My Bookings
                                </button>
                            ) : (
                                <button
                                    className="checkout-pay-btn"
                                    onClick={() => setResult(null)}
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    )}

                    {error && (
                        <p role="alert" style={{ color: "#ff7777", marginTop: "15px" }}>
                            {error}
                        </p>
                    )}

                    <p className="checkout-disclaimer">
                        Demo simulation only. No real money is transferred.
                    </p>

                    <p className="checkout-disclaimer">
                        No money will be transferred. Payment processing is not connected yet.
                    </p>
                </section>

                <aside className="checkout-summary">
                    <span className="checkout-eyebrow">BOOKING SUMMARY</span>
                    <h2>{flight?.airline || "Aurelia Air"}</h2>

                    <div className="checkout-pnr">
                        <span>BOOKING REFERENCE</span>
                        <strong>{booking.pnr}</strong>
                    </div>

                    <div className="checkout-route">
                        <div>
                            <strong>{flight?.departureTime}</strong>
                            <span>{search?.from}</span>
                        </div>
                        <Plane size={22} />
                        <div>
                            <strong>{flight?.arrivalTime}</strong>
                            <span>{search?.to}</span>
                        </div>
                    </div>

                    <div className="checkout-detail">
                        <span>Flight</span>
                        <strong>{flight?.code}</strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Departure</span>
                        <strong>{search?.departure}</strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Passengers</span>
                        <strong>{search?.passengers}</strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Cabin Class</span>
                        <strong>{cabinClass}</strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Cabin Fare / Passenger</span>
                        <strong>
                            ₹{Number(classFare).toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Meal</span>
                        <strong>{mealLabel}</strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Meal Charge</span>
                        <strong>
                            ₹{(Number(mealPrice) * passengerCount).toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div className="checkout-detail">
                        <span>Fare / Passenger</span>
                        <strong>
                            ₹{Number(perPassengerFare).toLocaleString("en-IN")}
                        </strong>
                    </div>

                    <div className="checkout-total">
                        <span>Total Amount</span>
                        <strong>₹{Number(total).toLocaleString("en-IN")}</strong>
                    </div>
                </aside>
            </div>
        </main>
    );
}