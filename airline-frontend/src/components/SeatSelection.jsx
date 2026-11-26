
import { useEffect, useState, useCallback } from "react";
import { Armchair, RefreshCw } from "lucide-react";
import "./SeatSelection.css";

const API_URL = "import.meta.env.VITE_API_URL";

export default function SeatSelection({
  flightId,
  passengerCount = 1,
  onSeatsChange
}) {
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // FETCH SEATS FROM DATABASE
  const fetchSeats = useCallback(async () => {
    if (!flightId) {
      setError("Flight ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/flights/${flightId}/seats`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load seats."
        );
      }

      const formattedSeats = data.seats.map(seat => ({
        seatId: seat.seat_id,
        seatNumber: seat.seat_number,
        seatType: seat.seat_type,
        seatStatus: seat.seat_status
      }));

      setSeats(formattedSeats);

      setSelectedSeats(previous =>
        previous.filter(number =>
          formattedSeats.some(
            seat =>
              seat.seatNumber === number &&
              seat.seatStatus === "AVAILABLE"
          )
        )
      );

    } catch (err) {
      console.error("Seat loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [flightId]);

  // LOAD SEATS WHEN FLIGHT CHANGES
  useEffect(() => {
    setSeats([]);
    setSelectedSeats([]);
    onSeatsChange?.([]);
    fetchSeats();
  }, [fetchSeats, onSeatsChange]);

  // SEND SELECTED SEATS TO BOOKING PAGE
  useEffect(() => {
    onSeatsChange?.(selectedSeats);
  }, [selectedSeats, onSeatsChange]);

  // SELECT / DESELECT SEAT
  const toggleSeat = seat => {
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

  // LOADING
  if (loading) {
    return (
      <div className="seat-loading">
        <RefreshCw className="seat-spinner" size={22} />
        <p>Loading available seats...</p>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="seat-error">
        <p>{error}</p>

        <button
          type="button"
          className="seat-refresh"
          onClick={fetchSeats}
        >
          <RefreshCw size={17} />
          Retry
        </button>
      </div>
    );
  }

  // NO SEATS
  if (seats.length === 0) {
    return (
      <div className="seat-error">
        <p>No seats are configured for this flight.</p>

        <button
          type="button"
          className="seat-refresh"
          onClick={fetchSeats}
        >
          <RefreshCw size={17} />
          Retry
        </button>
      </div>
    );
  }

  // CORRECT ROW NUMBERS: 1, 2, 3 ... 30
  const rows = [
    ...new Set(
      seats.map(seat =>
        Number(
          seat.seatNumber.match(/^\d+/)?.[0]
        )
      )
    )
  ].sort((a, b) => a - b);

  return (
    <div className="seat-selection">

      {/* HEADING */}
      <div className="seat-heading">
        <div>
          <h2>Select Your Seats</h2>
          <p>Choose your preferred seats</p>
        </div>

        <button
          type="button"
          className="seat-refresh"
          onClick={fetchSeats}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* LEGEND */}
      <div className="seat-legend">
        <span>
          <i className="available"></i>
          Available
        </span>

        <span>
          <i className="selected"></i>
          Selected
        </span>

        <span>
          <i className="booked"></i>
          Booked
        </span>
      </div>

      {/* AIRCRAFT LABEL */}
      <div className="aircraft-label">
        <Armchair size={24} />
        <span>AIRCRAFT SEAT MAP</span>
      </div>

      {/* SEAT GRID */}
      <div className="seat-grid">

        {rows.map(row => (
          <div className="seat-row" key={row}>

            <span className="row-label">
              {row}
            </span>

            {seats
              .filter(seat =>
                Number(
                  seat.seatNumber.match(/^\d+/)?.[0]
                ) === row
              )
              .map((seat, index) => (
                <div
                  key={seat.seatId}
                  className="seat-wrapper"
                >

                  {index === 3 && (
                    <div className="aisle"></div>
                  )}

                  <button
                    type="button"
                    className={`seat ${
                      seat.seatStatus === "BOOKED"
                        ? "booked"
                        : selectedSeats.includes(seat.seatNumber)
                        ? "selected"
                        : "available"
                    }`}
                    disabled={
                      seat.seatStatus !== "AVAILABLE"
                    }
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

      {/* SEAT SUMMARY */}
      <div className="seat-summary">

        <p>
          Selected:{" "}
          <strong>
            {selectedSeats.length}/{passengerCount}
          </strong>
        </p>

        <p>
          {selectedSeats.length === passengerCount
            ? "All passengers have a seat!"
            : `Select ${passengerCount - selectedSeats.length} more seat(s).`}
        </p>

        {selectedSeats.length > 0 && (
          <p>
            Your seats:{" "}
            <strong>
              {selectedSeats.join(", ")}
            </strong>
          </p>
        )}

      </div>

    </div>
  );
}
