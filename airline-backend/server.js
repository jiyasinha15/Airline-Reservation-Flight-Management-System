
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// JWT AUTHENTICATION MIDDLEWARE
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ADMIN ROLE MIDDLEWARE
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

app.get("/api/user/dashboard", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // User dashboard statistics
    const [stats] = await db.execute(
      `SELECT
                COUNT(*) AS totalBookings,
                SUM(CASE WHEN booking_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedBookings,
                SUM(CASE WHEN booking_status = 'PENDING' THEN 1 ELSE 0 END) AS pendingBookings
             FROM bookings
             WHERE user_id = ?`,
      [userId]
    );

    // Total successful payments
    const [payments] = await db.execute(
      `SELECT COALESCE(SUM(p.amount), 0) AS totalPaid
             FROM payments p
             JOIN bookings b ON p.booking_id = b.id
             WHERE b.user_id = ?
             AND p.payment_status = 'SUCCESS'`,
      [userId]
    );

    // Recent bookings
    const [recentBookings] = await db.execute(
      `SELECT
                b.id,
                b.pnr,
                b.booking_status,
                b.booking_date,
                f.flight_code,
                f.airline,
                f.origin,
                f.destination,
                f.departure_time,
                f.arrival_time,
                COALESCE(p.payment_status, 'UNPAID') AS payment_status
             FROM bookings b
             JOIN flights f ON b.flight_id = f.id
             LEFT JOIN (
                 SELECT booking_id, MAX(payment_status) AS payment_status
                 FROM payments
                 GROUP BY booking_id
             ) p ON b.id = p.booking_id
             WHERE b.user_id = ?
             ORDER BY b.booking_date DESC
             LIMIT 5`,
      [userId]
    );

    res.json({
      success: true,
      stats: {
        totalBookings: Number(stats[0].totalBookings || 0),
        confirmedBookings: Number(stats[0].confirmedBookings || 0),
        pendingBookings: Number(stats[0].pendingBookings || 0),
        totalPaid: Number(payments[0].totalPaid || 0)
      },
      recentBookings
    });

  } catch (error) {
    console.error("User dashboard error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard data."
    });
  }
});

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
    const { from, to, date, passengers = 1, airline } = req.query;

    const passengerCount = Number(passengers);

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid passenger count",
      });
    }

    let sql = `
      SELECT
        id,
        airline,
        flight_code AS flightCode,
        origin AS \`from\`,
        destination AS \`to\`,
        DATE_FORMAT(flight_date, '%Y-%m-%d') AS flightDate,

        DATE_FORMAT(departure_time, '%H:%i') AS departureTime,
        DATE_FORMAT(arrival_time, '%H:%i') AS arrivalTime,

        DATE_FORMAT(boarding_time, '%H:%i') AS boardingTime,
        DATE_FORMAT(actual_departure_time, '%H:%i') AS actualDepartureTime,
        DATE_FORMAT(actual_arrival_time, '%H:%i') AS actualArrivalTime,

        DATE_FORMAT(revised_departure_time, '%H:%i') AS revisedDepartureTime,
        DATE_FORMAT(revised_arrival_time, '%H:%i') AS revisedArrivalTime,

        delay_reason AS delayReason,
        cancellation_reason AS cancellationReason,

        last_status_update AS lastStatusUpdate,

        price,
        available_seats AS availableSeats,
        status

      FROM flights
      WHERE status != 'CANCELLED'
        AND available_seats >= ?
    `;

    const params = [passengerCount];

    if (from) {
      sql += " AND origin = ?";
      params.push(from.toUpperCase());
    }

    if (to) {
      sql += " AND destination = ?";
      params.push(to.toUpperCase());
    }

    if (date) {
      sql += " AND flight_date = ?";
      params.push(date);
    }

    if (airline) {
      sql += " AND airline = ?";
      params.push(airline);
    }

    sql += " ORDER BY departure_time ASC";

    const [flights] = await db.query(sql, params);

    res.json({
      success: true,
      count: flights.length,
      flights,
    });

  } catch (error) {
    console.error("Flights API Error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch flights",
    });
  }
});


app.get("/api/flights/:flightCode/tracking", async (req, res) => {
  try {
    const flightCode = req.params.flightCode.trim().toUpperCase();

    const [flights] = await db.execute(
      `SELECT
        id,
        airline,
        flight_code AS flightCode,
        origin,
        destination,
        DATE_FORMAT(flight_date, '%Y-%m-%d') AS flightDate,

        DATE_FORMAT(departure_time, '%H:%i') AS departureTime,
        DATE_FORMAT(arrival_time, '%H:%i') AS arrivalTime,
        DATE_FORMAT(boarding_time, '%H:%i') AS boardingTime,

        DATE_FORMAT(actual_departure_time, '%H:%i') AS actualDepartureTime,
        DATE_FORMAT(actual_arrival_time, '%H:%i') AS actualArrivalTime,

        DATE_FORMAT(revised_departure_time, '%H:%i') AS revisedDepartureTime,
        DATE_FORMAT(revised_arrival_time, '%H:%i') AS revisedArrivalTime,

        status,
        delay_reason AS delayReason,
        cancellation_reason AS cancellationReason,
        last_status_update AS lastStatusUpdate

      FROM flights
      WHERE flight_code = ?
      LIMIT 1`,
      [flightCode]
    );

    if (flights.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Flight not found. Please check the flight number.",
      });
    }

    res.json({
      success: true,
      flight: flights[0],
    });

  } catch (error) {
    console.error("Flight tracking error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to track flight.",
    });
  }
});


// PUBLIC REAL-TIME FLIGHT TRACKING API - AVIATIONSTACK

app.get("/api/live-tracking/:flightCode", async (req, res) => {
    try {
        const flightCode = req.params.flightCode.trim().toUpperCase();
        const apiKey = process.env.AVIATIONSTACK_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "Aviationstack API key missing."
            });
        }

        if (!/^[A-Z0-9]{2,10}$/.test(flightCode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid flight number."
            });
        }

        const url = new URL(
            "https://api.aviationstack.com/v1/flights"
        );

        url.searchParams.set("access_key", apiKey);
        url.searchParams.set("flight_iata", flightCode);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Aviationstack tracking error:", data.error);

            return res.status(502).json({
                success: false,
                message: data.error?.message ||
                    "Aviationstack API request failed."
            });
        }

        const flight = (data.data || []).find(item =>
            item.flight?.iata?.toUpperCase() === flightCode
        );

        if (!flight) {
            return res.status(404).json({
                success: false,
                message: "No live flight data found for this flight number."
            });
        }

        const departure = flight.departure || {};
        const arrival = flight.arrival || {};
        const aircraft = flight.aircraft || {};
        const liveData = flight.live;

        const formatTime = (value) => {
            if (!value) return null;

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) return null;

            return date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        };

        res.json({
            success: true,
            source: "Aviationstack",

            flight: {
                flightNumber:
                    flight.flight?.iata || flightCode,

                airline:
                    flight.airline?.name || "Unknown Airline",

                status:
                    (flight.flight_status || "unknown").toUpperCase(),

                departure: {
                    airport: departure.airport,
                    iata: departure.iata,
                    time: formatTime(departure.scheduled),
                    scheduled: departure.scheduled,
                    estimated: departure.estimated,
                    terminal: departure.terminal,
                    gate: departure.gate,
                    delay: departure.delay,
                    actual: departure.actual
                },

                arrival: {
                    airport: arrival.airport,
                    iata: arrival.iata,
                    time: formatTime(arrival.scheduled),
                    scheduled: arrival.scheduled,
                    estimated: arrival.estimated,
                    terminal: arrival.terminal,
                    gate: arrival.gate,
                    delay: arrival.delay,
                    actual: arrival.actual
                },

                aircraft: {
                    registration: aircraft.registration,
                    model: aircraft.iata || aircraft.icao || "Not available"
                },

                live: liveData?.latitude != null &&
                      liveData?.longitude != null
                    ? {
                        latitude: liveData.latitude,
                        longitude: liveData.longitude,
                        altitude: liveData.altitude,
                        speed: liveData.speed_horizontal,
                        direction: liveData.direction,
                        updated: liveData.updated
                    }
                    : null
            }
        });

    } catch (error) {
        console.error("Aviationstack tracking error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to fetch flight tracking data."
        });
    }
});






// ADMIN DASHBOARD STATISTICS
app.get(
  "/api/admin/stats",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [[flightData]] = await db.query(
        "SELECT COUNT(*) AS totalFlights FROM flights"
      );

      const [[passengerData]] = await db.query(
        "SELECT COUNT(*) AS totalPassengers FROM passengers"
      );

      const [[bookingData]] = await db.query(
        `SELECT
        COUNT(*) AS totalBookings,
        SUM(CASE WHEN booking_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmedBookings,
        SUM(CASE WHEN booking_status = 'PENDING' THEN 1 ELSE 0 END) AS pendingBookings
       FROM bookings`
      );

      const [[paymentData]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS totalRevenue
       FROM payments
       WHERE payment_status = 'SUCCESS'`
      );

      res.json({
        success: true,
        stats: {
          totalFlights: flightData.totalFlights,
          totalPassengers: passengerData.totalPassengers,
          totalBookings: bookingData.totalBookings,
          confirmedBookings: bookingData.confirmedBookings,
          pendingBookings: bookingData.pendingBookings,
          totalRevenue: Number(paymentData.totalRevenue),
        },
      });
    } catch (error) {
      console.error("Admin stats error:", error.message);
      res.status(500).json({
        success: false,
        message: "Unable to load dashboard statistics.",
      });
    }
  });


// ADMIN PASSENGER MANAGEMENT API
app.get(
  "/api/admin/passengers",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [passengers] = await db.query(`
        SELECT
          p.id,
          p.full_name AS name,
          p.age,
          p.gender,
          p.email,
          p.phone,
          COUNT(b.id) AS totalBookings
        FROM passengers p
        LEFT JOIN bookings b
          ON p.id = b.passenger_id
        GROUP BY
          p.id,
          p.full_name,
          p.age,
          p.gender,
          p.email,
          p.phone
        ORDER BY p.id DESC
      `);

      res.json({
        success: true,
        count: passengers.length,
        passengers,
      });
    } catch (error) {
      console.error("Passengers fetch error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to fetch passenger details.",
      });
    }
  }
);


// ADMIN BOOKING MANAGEMENT API
app.get(
  "/api/admin/bookings",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [bookings] = await db.query(`
        SELECT
          b.id,
          b.pnr,
          b.booking_status AS status,
          b.booking_date AS bookingDate,
          p.full_name AS passengerName,
          p.email AS passengerEmail,
          f.flight_code AS flightCode,
          f.airline,
          f.origin,
          f.destination,
          f.price
        FROM bookings b
        JOIN passengers p
          ON b.passenger_id = p.id
        JOIN flights f
          ON b.flight_id = f.id
        ORDER BY b.id DESC
      `);

      res.json({
        success: true,
        count: bookings.length,
        bookings,
      });
    } catch (error) {
      console.error("Admin bookings error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to fetch bookings.",
      });
    }
  }
);


// ADMIN PAYMENT MANAGEMENT API
app.get(
  "/api/admin/payments",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [payments] = await db.query(`
        SELECT
          pay.payment_id,
          pay.booking_id,
          pay.amount,
          pay.payment_method,
          pay.payment_status,
          pay.transaction_reference,
          pay.payment_date,
          b.pnr,
          p.full_name AS passengerName,
          p.email AS passengerEmail
        FROM payments pay
        JOIN bookings b
          ON pay.booking_id = b.id
        JOIN passengers p
          ON b.passenger_id = p.id
        ORDER BY pay.payment_id DESC
      `);

      res.json({
        success: true,
        count: payments.length,
        payments,
      });
    } catch (error) {
      console.error("Admin payments error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to fetch payment records.",
      });
    }
  }
);


// ADMIN BAGGAGE MANAGEMENT API
app.get(
  "/api/admin/baggage",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [baggage] = await db.query(`
        SELECT
          bg.baggage_id,
          bg.booking_id,
          bg.baggage_tag,
          bg.weight_kg,
          bg.baggage_type,
          bg.baggage_status,
          b.pnr,
          p.full_name AS passengerName
        FROM baggage bg
        JOIN bookings b
          ON bg.booking_id = b.id
        JOIN passengers p
          ON b.passenger_id = p.id
        ORDER BY bg.baggage_id DESC
      `);

      res.json({
        success: true,
        count: baggage.length,
        baggage,
      });
    } catch (error) {
      console.error("Admin baggage error:", error.message);

      res.status(500).json({
        success: false,
        message: "Unable to fetch baggage records.",
      });
    }
  }
);


// ADMIN: ADD NEW FLIGHT
app.post(
  "/api/admin/flights",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        airline,
        flight_code,
        origin,
        destination,
        departure_time,
        arrival_time,
        price,
        available_seats,
      } = req.body;

      if (
        !airline?.trim() ||
        !flight_code?.trim() ||
        !origin?.trim() ||
        !destination?.trim() ||
        !departure_time ||
        !arrival_time ||
        price === undefined ||
        available_seats === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Please fill all required flight fields.",
        });
      }

      const flightPrice = Number(price);
      const seats = Number(available_seats);

      if (
        !Number.isFinite(flightPrice) ||
        flightPrice <= 0 ||
        !Number.isInteger(seats) ||
        seats < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid flight price or available seats.",
        });
      }

      const [result] = await db.execute(
        `INSERT INTO flights
        (airline, flight_code, origin, destination,
         departure_time, arrival_time, price, available_seats)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          airline.trim(),
          flight_code.trim().toUpperCase(),
          origin.trim(),
          destination.trim(),
          departure_time,
          arrival_time,
          flightPrice,
          seats,
        ]
      );

      res.status(201).json({
        success: true,
        message: "Flight added successfully!",
        flightId: result.insertId,
      });
    } catch (error) {
      console.error("Add flight error:", error.message);

      res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
        success: false,
        message:
          error.code === "ER_DUP_ENTRY"
            ? "This flight code already exists."
            : "Unable to add flight.",
      });
    }
  }
);

// ADMIN: UPDATE FLIGHT

app.put(
  "/api/admin/flights/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      const {
        airline,
        flight_code,
        origin,
        destination,
        departure_time,
        arrival_time,
        price,
        available_seats,
      } = req.body;

      if (
        !Number.isInteger(id) ||
        id < 1 ||
        !airline?.trim() ||
        !flight_code?.trim() ||
        !origin?.trim() ||
        !destination?.trim() ||
        !departure_time ||
        !arrival_time ||
        price === undefined ||
        available_seats === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid flight details.",
        });
      }

      const flightPrice = Number(price);
      const seats = Number(available_seats);

      if (
        !Number.isFinite(flightPrice) ||
        flightPrice <= 0 ||
        !Number.isInteger(seats) ||
        seats < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid flight price or available seats.",
        });
      }

      const allowedStatuses = [
        "SCHEDULED",
        "BOARDING",
        "DELAYED",
        "CANCELLED",
        "DEPARTED",
        "IN_AIR",
        "ARRIVED",
      ];

      const optionalFields = [
        "boarding_time",
        "actual_departure_time",
        "actual_arrival_time",
        "revised_departure_time",
        "revised_arrival_time",
        "delay_reason",
        "cancellation_reason",
      ];

      const timeFields = [
        "boarding_time",
        "actual_departure_time",
        "actual_arrival_time",
        "revised_departure_time",
        "revised_arrival_time",
      ];

      const updates = [
        "airline = ?",
        "flight_code = ?",
        "origin = ?",
        "destination = ?",
        "departure_time = ?",
        "arrival_time = ?",
        "price = ?",
        "available_seats = ?",
      ];

      const values = [
        airline.trim(),
        flight_code.trim().toUpperCase(),
        origin.trim(),
        destination.trim(),
        departure_time,
        arrival_time,
        flightPrice,
        seats,
      ];

      // Validate and update status only when supplied.
      if (Object.hasOwn(req.body, "status")) {
        if (!allowedStatuses.includes(req.body.status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid flight status.",
          });
        }

        updates.push("status = ?");
        values.push(req.body.status);
      }

      // Update operational fields only when supplied.
      for (const field of optionalFields) {
        if (Object.hasOwn(req.body, field)) {
          const value = req.body[field];

          if (timeFields.includes(field)) {
            if (
              value !== null &&
              (typeof value !== "string" ||
                !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value))
            ) {
              return res.status(400).json({
                success: false,
                message: `Invalid time format for ${field}. Use HH:MM or HH:MM:SS.`,
              });
            }
          } else if (
            value !== null &&
            (typeof value !== "string" || value.length > 255)
          ) {
            return res.status(400).json({
              success: false,
              message: `Invalid value for ${field}.`,
            });
          }

          updates.push(`${field} = ?`);
          values.push(value);
        }
      }

      values.push(id);

      const [result] = await db.execute(
        `UPDATE flights
         SET ${updates.join(", ")}
         WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        const [existing] = await db.execute(
          "SELECT id FROM flights WHERE id = ?",
          [id]
        );

        if (existing.length === 0) {
          return res.status(404).json({
            success: false,
            message: "Flight not found.",
          });
        }
      }

      res.json({
        success: true,
        message: "Flight operations updated successfully!",
      });

    } catch (error) {
      console.error("Update flight error:", error);

      res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
        success: false,
        message:
          error.code === "ER_DUP_ENTRY"
            ? "This flight code already exists."
            : "Unable to update flight.",
      });
    }
  }
);


// ADMIN: DELETE FLIGHT
app.delete(
  "/api/admin/flights/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid flight ID.",
        });
      }

      const [result] = await db.execute(
        "DELETE FROM flights WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Flight not found.",
        });
      }

      res.json({
        success: true,
        message: "Flight deleted successfully!",
      });
    } catch (error) {
      console.error("Delete flight error:", error.message);

      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          success: false,
          message: "This flight has existing bookings and cannot be deleted.",
        });
      }

      res.status(500).json({
        success: false,
        message: "Unable to delete flight.",
      });
    }
  }
);



app.get("/api/flights/:flightId/seats", async (req, res) => {
  const flightId = Number(req.params.flightId);

  if (!Number.isInteger(flightId) || flightId < 1) {
    return res.status(400).json({
      success: false,
      message: "Invalid flight ID."
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Step 1: Find flight and assigned aircraft capacity
    const [flights] = await connection.execute(
      `SELECT
          f.id,
          f.flight_code,
          f.aircraft_id,
          f.available_seats,
          a.seat_capacity
       FROM flights f
       LEFT JOIN aircraft a
         ON f.aircraft_id = a.aircraft_id
       WHERE f.id = ?
       FOR UPDATE`,
      [flightId]
    );

    if (flights.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Flight not found."
      });
    }

    const flight = flights[0];

    // Step 2: Validate aircraft
    if (
      !flight.seat_capacity ||
      Number(flight.seat_capacity) < 1
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Aircraft is not assigned or has invalid seat capacity."
      });
    }

    const capacity = Number(flight.seat_capacity);
    const availableSeats = Number(flight.available_seats);

    // Step 3: Check existing seat records
    const [existingSeats] = await connection.execute(
      `SELECT COUNT(*) AS total
       FROM flight_seats
       WHERE flight_id = ?`,
      [flightId]
    );

    // Step 4: Generate seats if they do not exist
    if (Number(existingSeats[0].total) === 0) {
      const columns = ["A", "B", "C", "D", "E", "F"];

      for (let i = 0; i < capacity; i++) {
        const row = Math.floor(i / 6) + 1;
        const column = columns[i % 6];

        let seatType;

        if (column === "A" || column === "F") {
          seatType = "WINDOW";
        } else if (column === "B" || column === "E") {
          seatType = "MIDDLE";
        } else {
          seatType = "AISLE";
        }

        await connection.execute(
          `INSERT INTO flight_seats
             (flight_id, seat_number, seat_type)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE
             seat_number = VALUES(seat_number)`,
          [flightId, `${row}${column}`, seatType]
        );
      }

      // Preserve old bookings when exact seat assignments
      // are not available in historical booking records.
      const previouslyBooked = Math.max(
        0,
        Math.min(capacity, capacity - availableSeats)
      );

      if (previouslyBooked > 0) {
        await connection.execute(
          `UPDATE flight_seats
           SET seat_status = 'BOOKED'
           WHERE flight_id = ?
           ORDER BY seat_id
           LIMIT ${previouslyBooked}`,
          [flightId]
        );
      }
    }

    // Step 5: Fetch seats
    const [seats] = await connection.execute(
      `SELECT
          seat_id,
          flight_id,
          seat_number,
          seat_type,
          seat_status
       FROM flight_seats
       WHERE flight_id = ?
       ORDER BY
         CAST(
           SUBSTRING(
             seat_number,
             1,
             LENGTH(seat_number) - 1
           ) AS UNSIGNED
         ),
         RIGHT(seat_number, 1)`,
      [flightId]
    );

    await connection.commit();

    return res.json({
      success: true,
      flightId,
      flightCode: flight.flight_code,
      totalSeats: capacity,
      seats
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Seat fetching error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch flight seats."
    });

  } finally {
    connection?.release();
  }
});

// Demo booking API


app.post("/api/bookings", authenticateToken, async (req, res) => {
  const { passenger, passengers, flightId, seatNumbers } = req.body;

  // Support old single-passenger and multiple-passenger formats
  const passengerList = Array.isArray(passengers)
    ? passengers
    : passenger
      ? [passenger]
      : [];

  const id = Number(flightId);

  // Basic validation
  if (
    passengerList.length < 1 ||
    passengerList.length > 9 ||
    !Number.isInteger(id) ||
    id < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide valid passenger details and flight ID. Maximum 9 passengers allowed.",
    });
  }

  // Validate seat selection
  if (
    !Array.isArray(seatNumbers) ||
    seatNumbers.length !== passengerList.length ||
    new Set(seatNumbers).size !== seatNumbers.length ||
    seatNumbers.some(
      seat => typeof seat !== "string" || !seat.trim()
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "Please select one unique seat for every passenger.",
    });
  }

  // Validate every passenger
  for (const p of passengerList) {
    const age = Number(p.age);

    if (
      !p.name?.trim() ||
      !Number.isInteger(age) ||
      age < 1 ||
      age > 120 ||
      !p.gender ||
      !p.email?.trim() ||
      !p.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid details for every passenger.",
      });
    }
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock flight row
    const [flights] = await connection.execute(
      `SELECT id, available_seats
             FROM flights
             WHERE id = ?
             FOR UPDATE`,
      [id]
    );

    if (flights.length === 0) {
      throw new Error("Selected flight was not found.");
    }

    const passengerCount = passengerList.length;
    const availableSeats = Number(flights[0].available_seats);

    if (availableSeats < passengerCount) {
      throw new Error(
        `Only ${availableSeats} seats are available.`
      );
    }

    // Lock selected seat rows
    const placeholders = seatNumbers.map(() => "?").join(",");

    const [selectedSeatRows] = await connection.execute(
      `SELECT seat_id, seat_number, seat_status
             FROM seats
             WHERE flight_id = ?
             AND seat_number IN (${placeholders})
             FOR UPDATE`,
      [id, ...seatNumbers]
    );

    // Check whether all requested seats exist
    if (selectedSeatRows.length !== passengerCount) {
      throw new Error(
        "One or more selected seats do not exist for this flight."
      );
    }

    // Check whether seats are still available
    const unavailableSeats = selectedSeatRows.filter(
      seat => seat.seat_status !== "AVAILABLE"
    );

    if (unavailableSeats.length > 0) {
      throw new Error(
        "Some selected seats have already been booked. Please select different seats."
      );
    }

    // Insert passengers
    const passengerIds = [];

    for (const p of passengerList) {
      const [result] = await connection.execute(
        `INSERT INTO passengers
                 (full_name, age, gender, email, phone)
                 VALUES (?, ?, ?, ?, ?)`,
        [
          p.name.trim(),
          Number(p.age),
          p.gender,
          p.email.trim(),
          p.phone,
        ]
      );

      passengerIds.push(result.insertId);
    }

    // Generate one PNR for the booking
    const pnr =
      "AU" + randomBytes(4).toString("hex").toUpperCase();

    // Create booking
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings
   (user_id, pnr, passenger_id, flight_id, booking_status, seats_released)
   VALUES (?, ?, ?, ?, 'PENDING', 0)`,
      [req.user.userId, pnr, passengerIds[0], id]
    );

    const bookingId = bookingResult.insertId;

    // Link all passengers to booking
    for (const passengerId of passengerIds) {
      await connection.execute(
        `INSERT INTO booking_passengers
                 (booking_id, passenger_id)
                 VALUES (?, ?)`,
        [bookingId, passengerId]
      );
    }

    // Assign selected seats to their respective passengers
    for (let i = 0; i < seatNumbers.length; i++) {
      const [updateResult] = await connection.execute(
        `UPDATE seats
                 SET seat_status = 'BOOKED',
                     booking_id = ?,
                     passenger_id = ?
                 WHERE flight_id = ?
                 AND seat_number = ?
                 AND seat_status = 'AVAILABLE'`,
        [
          bookingId,
          passengerIds[i],
          id,
          seatNumbers[i],
        ]
      );

      if (updateResult.affectedRows !== 1) {
        throw new Error(
          `Seat ${seatNumbers[i]} could not be reserved.`
        );
      }
    }

    // Update flight's available seat count
    await connection.execute(
      `UPDATE flights
             SET available_seats = available_seats - ?
             WHERE id = ?`,
      [passengerCount, id]
    );

    console.log("BOOKING USER:", req.user);

    // Commit transaction
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Booking and seats reserved successfully!",
      booking: {
        id: bookingId,
        pnr,
        passengerIds,
        passengerCount,
        seatNumbers,
        flightId: id,
        status: "PENDING",
      },
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Booking save error:", error);

    const clientErrors = [
      "Selected flight was not found.",
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Only ") ||
      error.message.startsWith("One or more") ||
      error.message.startsWith("Some selected") ||
      error.message.startsWith("Seat ");

    return res.status(isClientError ? 409 : 500).json({
      success: false,
      message: isClientError
        ? error.message
        : "Unable to save booking. Please try again.",
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

// USER SIGNUP API
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existingUsers] = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role)
       VALUES (?, ?, ?, ?, 'USER')`,
      [name.trim(), normalizedEmail, phone.trim(), passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "Account created successfully!",
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
        role: "USER",
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create account.",
    });
  }
});


// USER / ADMIN LOGIN API
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password || !["USER", "ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid login details.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.execute(
      `SELECT user_id, full_name, email, password_hash, role
       FROM users
       WHERE email = ? AND role = ?
       LIMIT 1`,
      [normalizedEmail, role]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to login. Please try again.",
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

// ================= PAYMENT API =================

app.post("/api/payments", async (req, res) => {
  const { bookingId, paymentMethod, passengerCount, simulateFailure } = req.body;

  const allowedMethods = ["UPI", "CARD", "NET_BANKING"];

  if (
    !bookingId ||
    !allowedMethods.includes(paymentMethod) ||
    !Number.isInteger(Number(passengerCount)) ||
    Number(passengerCount) < 1
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment details.",
    });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Get booking and flight fare
    const [rows] = await connection.execute(
      `SELECT b.id, b.booking_status, f.price
       FROM bookings b
       JOIN flights f ON b.flight_id = f.id
       WHERE b.id = ?
       FOR UPDATE`,
      [bookingId]
    );

    if (rows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const booking = rows[0];

    // Prevent duplicate successful payment
    const [existingPayment] = await connection.execute(
      `SELECT payment_id FROM payments
       WHERE booking_id = ? AND payment_status = 'SUCCESS'`,
      [bookingId]
    );

    if (existingPayment.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: "This booking is already paid.",
      });
    }

    // Calculate amount using database fare
    const amount = Number(booking.price) * Number(passengerCount);

    // Demo simulation only
    const paymentStatus = simulateFailure ? "FAILED" : "SUCCESS";

    const transactionReference =
      "AU-PAY-" + randomBytes(6).toString("hex").toUpperCase();

    // Save payment record
    const [paymentResult] = await connection.execute(
      `INSERT INTO payments
       (booking_id, amount, payment_method, payment_status, transaction_reference)
       VALUES (?, ?, ?, ?, ?)`,
      [
        bookingId,
        amount,
        paymentMethod,
        paymentStatus,
        transactionReference,
      ]
    );

    // Confirm booking only after successful demo payment
    if (paymentStatus === "SUCCESS") {

      await connection.execute(
        `UPDATE bookings
     SET booking_status = 'CONFIRMED'
     WHERE id = ?`,
        [bookingId]
      );
    } else {
      // Release reserved seats only once
      const [releaseResult] = await connection.execute(
        `UPDATE bookings
     SET booking_status = 'CANCELLED',
         seats_released = 1
     WHERE id = ?
       AND seats_released = 0
       AND booking_status = 'PENDING'`,
        [bookingId]
      );

      if (releaseResult.affectedRows === 1) {
        await connection.execute(
          `UPDATE flights f
       JOIN bookings b ON b.flight_id = f.id
       SET f.available_seats = f.available_seats + ?
       WHERE b.id = ?`,
          [Number(passengerCount), bookingId]
        );
      }
    }


    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        paymentStatus === "SUCCESS"
          ? "Demo payment successful. Booking confirmed."
          : "Demo payment failed. Booking remains pending.",
      payment: {
        paymentId: paymentResult.insertId,
        bookingId,
        amount,
        paymentMethod,
        paymentStatus,
        transactionReference,
      },
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment could not be processed.",
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});



app.get("/api/track-flight/:flightNumber", async (req, res) => {
  try {
    const flightNumber = req.params.flightNumber.trim().toUpperCase();

    if (!/^[A-Z0-9]{2,10}$/.test(flightNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid flight number."
      });
    }

    const apiKey = process.env.AIRLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Flight tracking API is not configured."
      });
    }

    // First: Search live or closest flight
    const flightResponse = await axios.get(
      "https://airlabs.co/api/v9/flight",
      {
        params: {
          flight_iata: flightNumber,
          api_key: apiKey
        },
        timeout: 15000
      }
    );

    if (flightResponse.data?.error) {
      throw new Error(
        flightResponse.data.error.message || "AirLabs flight API error"
      );
    }

    const liveFlight = flightResponse.data?.response;

    if (liveFlight) {
      return res.json({
        success: true,
        source: "flight",
        livePositionAvailable:
          liveFlight.lat != null && liveFlight.lng != null,
        flight: {
          flightNumber: liveFlight.flight_iata,
          airline: liveFlight.airline_iata,
          status: liveFlight.status,
          departure: liveFlight.dep_iata,
          arrival: liveFlight.arr_iata,
          departureTime: liveFlight.dep_time,
          arrivalTime: liveFlight.arr_time,
          estimatedDeparture: liveFlight.dep_estimated,
          estimatedArrival: liveFlight.arr_estimated,
          latitude: liveFlight.lat,
          longitude: liveFlight.lng,
          altitude: liveFlight.alt,
          speed: liveFlight.speed,
          direction: liveFlight.dir,
          aircraft: liveFlight.aircraft_icao
        }
      });
    }

    // Second: Search scheduled flights
    const scheduleResponse = await axios.get(
      "https://airlabs.co/api/v9/schedules",
      {
        params: {
          flight_iata: flightNumber,
          api_key: apiKey
        },
        timeout: 15000
      }
    );

    if (scheduleResponse.data?.error) {
      throw new Error(
        scheduleResponse.data.error.message || "AirLabs schedules API error"
      );
    }

    const schedules = scheduleResponse.data?.response;

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No live or scheduled flight found for this number."
      });
    }

    const scheduledFlight = schedules[0];

    return res.json({
      success: true,
      source: "schedule",
      livePositionAvailable: false,
      flight: {
        flightNumber: scheduledFlight.flight_iata,
        airline: scheduledFlight.airline_iata,
        status: scheduledFlight.status,
        departure: scheduledFlight.dep_iata,
        arrival: scheduledFlight.arr_iata,
        departureTime: scheduledFlight.dep_time,
        arrivalTime: scheduledFlight.arr_time,
        estimatedDeparture: scheduledFlight.dep_estimated,
        estimatedArrival: scheduledFlight.arr_estimated,
        latitude: null,
        longitude: null,
        aircraft: scheduledFlight.aircraft_icao
      }
    });

  } catch (error) {
    console.error(
      "Flight tracking error:",
      error.response?.data || error.message
    );

    res.status(502).json({
      success: false,
      message: "Unable to retrieve flight information right now."
    });
  }
});


// GET SEATS FOR A FLIGHT
app.get("/api/seats/:flightId", async (req, res) => {
  try {
    const flightId = Number(req.params.flightId);

    if (!Number.isInteger(flightId) || flightId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid flight ID"
      });
    }

    const [seats] = await db.query(
      `SELECT 
        seat_id AS seatId,
        flight_id AS flightId,
        seat_number AS seatNumber,
        seat_status AS seatStatus
       FROM seats
       WHERE flight_id = ?
       ORDER BY seat_id`,
      [flightId]
    );

    res.json({
      success: true,
      totalSeats: seats.length,
      seats
    });

  } catch (error) {
    console.error("Seat fetching error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch seats"
    });
  }
});

// DATABASE TRACKING - AURELIA AIR FLIGHTS
app.get("/api/database-tracking/:flightCode", async (req, res) => {
  try {
    const flightCode = req.params.flightCode.trim().toUpperCase();

    const [rows] = await db.query(
      `SELECT
    f.id,
    f.flight_code,
    f.airline,
    f.origin,
    f.destination,
    f.flight_date,
    f.status,
    f.boarding_time,
    f.departure_time,
    f.arrival_time,
    f.revised_departure_time,
    f.revised_arrival_time,
    f.actual_departure_time,
    f.actual_arrival_time,
    f.delay_reason,
    f.cancellation_reason,
    f.last_status_update,
    a.model AS aircraft_model,
    a.registration_no AS aircraft_registration
   FROM flights f
   LEFT JOIN aircraft a
     ON f.aircraft_id = a.aircraft_id
   WHERE UPPER(f.flight_code) = ?
   LIMIT 1`,
      [flightCode]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aurelia Air flight not found in database."
      });
    }

    const row = rows[0];

    res.json({
      success: true,
      source: "DATABASE",
      flight: {
        flightNumber: row.flight_code,
        airline: row.airline,
        status: row.status,

        departure: {
          airport: row.origin,
          iata: row.origin_airport_code,
          time: row.departure_time,
          estimated: row.revised_departure_time
        },

        arrival: {
          airport: row.destination,
          iata: row.destination_airport_code,
          time: row.arrival_time,
          estimated: row.revised_arrival_time
        },

        boardingTime: row.boarding_time,
        actualDepartureTime: row.actual_departure_time,
        actualArrivalTime: row.actual_arrival_time,
        delayReason: row.delay_reason,
        cancellationReason: row.cancellation_reason,
        lastStatusUpdate: row.last_status_update,

        aircraft: row.aircraft_model
          ? {
            model: row.aircraft_model,
            registration: row.aircraft_registration
          }
          : null,
        live: null
      }
    });

  } catch (error) {
    console.error("Database tracking error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch flight tracking information."
    });
  }
});

// GET ALL AIRPORTS
app.get("/api/airports", async (req, res) => {
  try {
    const [airports] = await db.execute(
      `SELECT airport_code AS code,
                    airport_name AS name,
                    city,
                    country
             FROM airports
             ORDER BY city ASC`
    );

    res.json({
      success: true,
      airports
    });

  } catch (error) {
    console.error("Airports fetch error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch airports"
    });
  }
});


// AVIATIONSTACK - AIRPORTS API
app.get("/api/aviation/airports", async (req, res) => {
  try {
    const apiKey = process.env.AVIATIONSTACK_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Aviation API key is not configured."
      });
    }

    const url = new URL(
      "https://api.aviationstack.com/v1/airports"
    );

    url.searchParams.set("access_key", apiKey);
    url.searchParams.set("limit", "1");


    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Aviationstack API error:", {
        status: response.status,
        error: data.error
      });

      return res.status(502).json({
        success: false,
        providerStatus: response.status,
        providerError: data.error?.code || "unknown_error",
        providerMessage: data.error?.message || "Unknown provider error"
      });
    }

    const airports = (data.data || [])
      .filter(airport => airport.iata_code)
      .map(airport => ({
        code: airport.iata_code,
        name: airport.airport_name,
        city: airport.city,
        country: airport.country_name
      }));

    res.json({
      success: true,
      count: airports.length,
      airports
    });

  } catch (error) {
    console.error("Airport API error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch airport information."
    });
  }
});

app.get("/api/aviation/test-flights", async (req, res) => {
    try {
        const apiKey = process.env.AVIATIONSTACK_API_KEY;

        const url = new URL(
            "https://api.aviationstack.com/v1/flights"
        );

        url.searchParams.set("access_key", apiKey);
        url.searchParams.set("limit", "1");

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.error) {
            console.error("Flight API error:", data.error);

            return res.status(502).json({
                success: false,
                providerStatus: response.status,
                providerError: data.error?.code,
                providerMessage: data.error?.message
            });
        }

        res.json({
            success: true,
            count: data.data?.length || 0,
            flights: data.data || []
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

app.listen(PORT, () => {
  console.log(`Aurelia Air backend running at http://localhost:${PORT}`);
});
