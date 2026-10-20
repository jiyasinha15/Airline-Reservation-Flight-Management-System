
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import { randomBytes } from "node:crypto";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Aurelia Air Backend!",
  });
});


 // MySQL se flights fetch karne wali API
app.get("/api/flights", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        airline,
        flight_code AS flightCode,
        origin AS \`from\`,
        destination AS \`to\`,
        TIME_FORMAT(departure_time, '%H:%i') AS departureTime,
        TIME_FORMAT(arrival_time, '%H:%i') AS arrivalTime,
        price,
        available_seats AS availableSeats
      FROM flights
      ORDER BY departure_time ASC
    `);

    res.json({
      success: true,
      count: rows.length,
      flights: rows,
    });
  } catch (error) {
    console.error("Flights fetch error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch flights from database.",
    });
  }
});


// Demo booking API

app.post("/api/bookings", async (req, res) => {
  const { passenger, flightId } = req.body;

  if (
    !passenger ||
    !passenger.name?.trim() ||
    !passenger.age ||
    !passenger.gender ||
    !passenger.email?.trim() ||
    !passenger.phone ||
    !flightId
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all passenger details and a valid flight ID.",
    });
  }

  const age = Number(passenger.age);
  const id = Number(flightId);

  if (
    !Number.isInteger(age) ||
    age < 1 ||
    age > 120 ||
    !Number.isInteger(id) ||
    id < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid passenger age or flight ID.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [flights] = await connection.execute(
      "SELECT id FROM flights WHERE id = ?",
      [id]
    );

    if (flights.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Selected flight was not found.",
      });
    }

    const [passengerResult] = await connection.execute(
      `INSERT INTO passengers
       (full_name, age, gender, email, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [
        passenger.name.trim(),
        age,
        passenger.gender,
        passenger.email.trim(),
        passenger.phone,
      ]
    );

    const pnr = "AU" + randomBytes(4).toString("hex").toUpperCase();

    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings
       (pnr, passenger_id, flight_id, booking_status)
       VALUES (?, ?, ?, ?)`,
      [pnr, passengerResult.insertId, id, "PENDING"]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Demo booking saved successfully!",
      booking: {
        id: bookingResult.insertId,
        pnr,
        passengerId: passengerResult.insertId,
        flightId: id,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Booking save error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save booking. Please try again.",
    });
  } finally {
    connection?.release();
  }
});



 // Find a booking using its PNR
app.get("/api/bookings/:pnr", async (req, res) => {
  const pnr = req.params.pnr.trim().toUpperCase();

  if (!/^[A-Z0-9]{6,20}$/.test(pnr)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid booking reference.",
    });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         b.pnr,
         b.booking_status AS status,
         b.booking_date AS bookingDate,
         p.full_name AS passengerName,
         f.airline,
         f.flight_code AS flightCode,
         f.origin,
         f.destination,
         f.departure_time AS departureTime,
         f.arrival_time AS arrivalTime,
         f.price
       FROM bookings b
       JOIN passengers p ON b.passenger_id = p.id
       JOIN flights f ON b.flight_id = f.id
       WHERE b.pnr = ?
       LIMIT 1`,
      [pnr]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No booking found for this PNR.",
      });
    }

    const booking = rows[0];

    res.json({
      success: true,
      booking: {
        ...booking,
        price: Number(booking.price),
      },
    });
  } catch (error) {
    console.error("Booking lookup error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to retrieve booking. Please try again.",
    });
  }
});


const PORT = process.env.PORT || 5000;


app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "MySQL connected successfully!",
      result: rows[0],
    });
  } catch (error) {
    console.error("Database connection error:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed. Check your .env settings.",
    });
  }
});


app.listen(PORT, () => {
  console.log(`Aurelia Air backend running at http://localhost:${PORT}`);
});
