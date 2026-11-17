
import { useEffect, useState } from "react";
import { Armchair, RefreshCw } from "lucide-react";
import "./SeatSelection.css";

export default function SeatSelection({
  flightId,
  passengerCount = 1,
  onSeatsChange
}) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSeats = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/seats/${flightId}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load seats");
      }

      setSeats(data.seats);
      setSelectedSeats(previous =>
        previous.filter(number =>
          data.seats.some(
            seat =>
              seat.seatNumber === number &&
              seat.seatStatus === "AVAILABLE"
          )
        )
      );

      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedSeats([]);
    onSeatsChange?.([]);
    fetchSeats();
  }, [flightId]);

  useEffect(() => {
    onSeatsChange?.(selectedSeats);
  }, [selectedSeats]);

  const toggleSeat = (seat) => {
    if (seat.seatStatus !== "AVAILABLE") return;

    setSelectedSeats(previous => {
      if (previous.includes(seat.seatNumber)) {
        return previous.filter(
          number => number !== seat.seatNumber
        );
      }

      if (previous.length >= passengerCount) {
        return previous;
      }

      return [...previous, seat.seatNumber];
    });
  };

  if (loading) return <p>Loading seats...</p>;

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={fetchSeats}>Retry</button>
      </div>
    );
  }

  const rows = [...new Set(
    seats.map(seat => seat.seatNumber.charAt(0))
  )];

  return (
    <div className="seat-selection">

      <div className="seat-heading">
        <div>
          <h2>Select Your Seats</h2>
          <p>Choose your preferred seats</p>
        </div>

        <button className="seat-refresh" onClick={fetchSeats}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="seat-legend">
        <span><i className="available"></i> Available</span>
        <span><i className="selected"></i> Selected</span>
        <span><i className="booked"></i> Booked</span>
      </div>

      <div className="aircraft-label">
        <Armchair size={24} />
        <span>AIRCRAFT SEAT MAP</span>
      </div>

      <div className="seat-grid">
        {rows.map(row => (
          <div className="seat-row" key={row}>
            <span className="row-label">{row}</span>

            {seats
              .filter(seat =>
                seat.seatNumber.startsWith(row)
              )
              .map((seat, index) => (
                <div key={seat.seatId} className="seat-wrapper">

                  {index === 3 && (
                    <div className="aisle"></div>
                  )}

                  <button
                    className={`seat ${
                      seat.seatStatus === "BOOKED"
                        ? "booked"
                        : selectedSeats.includes(seat.seatNumber)
                        ? "selected"
                        : "available"
                    }`}
                    disabled={seat.seatStatus !== "AVAILABLE"}
                    onClick={() => toggleSeat(seat)}
                    title={`${seat.seatNumber} - ${seat.seatStatus}`}
                  >
                    {seat.seatNumber}
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="seat-summary">
        <p>
          Selected: <strong>
            {selectedSeats.length}/{passengerCount}
          </strong>
        </p>

        <p>
          {selectedSeats.length === passengerCount
            ? "All passengers have a seat!"
            : `Select ${passengerCount - selectedSeats.length} more seat(s).`}
        </p>
      </div>

    </div>
  );
}
