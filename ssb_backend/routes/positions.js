const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM real_time_positions ORDER BY position_id DESC LIMIT 1000");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.get("/bus/:bus_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM real_time_positions WHERE bus_id = ? ORDER BY reported_at DESC LIMIT 100", [req.params.bus_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { bus_id, lat, lon, speed_kmh, heading } = req.body;

  if (!bus_id || !lat || !lon) return res.status(400).json({ success: false, error: "Thông tin vị trí bắt buộc" });

  try {
    const reported_at = new Date();
    const [result] = await pool.query(
      "INSERT INTO real_time_positions (bus_id, lat, lon, speed_kmh, heading, reported_at) VALUES (?, ?, ?, ?, ?, ?)",
      [bus_id, lat, lon, speed_kmh || 0, heading || 0, reported_at]
    );

    await pool.query(
      "UPDATE buses SET current_lat = ?, current_lon = ?, last_position_time = ? WHERE bus_id = ?",
      [lat, lon, reported_at, bus_id]
    );

    const newPosition = { position_id: result.insertId, bus_id, lat, lon, speed_kmh, heading, reported_at };
    req.app.get("io")?.emit("positionUpdated", newPosition);

    res.status(201).json({ success: true, message: "Cập nhật vị trí thành công", data: newPosition });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
