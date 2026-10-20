
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";
import Flights from "./pages/Flights.jsx";
import Booking from "./pages/Booking.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/booking" element={<Booking />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
