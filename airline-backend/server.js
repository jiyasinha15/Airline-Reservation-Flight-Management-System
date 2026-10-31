
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

      const [result] = await db.execute(
        `UPDATE flights
         SET airline = ?,
             flight_code = ?,
             origin = ?,
             destination = ?,
             departure_time = ?,
             arrival_time = ?,
             price = ?,
             available_seats = ?
         WHERE id = ?`,
        [
          airline.trim(),
          flight_code.trim().toUpperCase(),
          origin.trim(),
          destination.trim(),
          departure_time,
          arrival_time,
          flightPrice,
          seats,
          id,
        ]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Flight not found.",
        });
      }

      res.json({
        success: true,
        message: "Flight updated successfully!",
      });
    } catch (error) {
      console.error("Update flight error:", error.message);

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


app.listen(PORT, () => {
  console.log(`Aurelia Air backend running at http://localhost:${PORT}`);
});
