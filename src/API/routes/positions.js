// routes/positions.js
const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.post("/", async (req, res) => {
  const { bus_id, lat, lon, speed_kmh = 0, heading = 0 } = req.body;

  if (!bus_id || lat == null || lon == null) {
    return res.status(400).json({ success: false, error: "Thiếu bus_id, lat, lon" });
  }

  try {
    const reported_at = new Date();

    // Lưu lịch sử
    await pool.query(
      `INSERT INTO real_time_positions (bus_id, lat, lon, speed_kmh, heading, reported_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bus_id, lat, lon, speed_kmh, heading, reported_at]
    );

    // Cập nhật vị trí hiện tại
    await pool.query(
      `UPDATE buses SET current_lat = ?, current_lon = ?, last_position_time = ? WHERE bus_id = ?`,
      [lat, lon, reported_at, bus_id]
    );

    // Lấy plate_no thật
    const [bus] = await pool.query("SELECT plate_no FROM buses WHERE bus_id = ?", [bus_id]);
    const vehicleId = bus[0]?.plate_no || `BUS-${bus_id}`;

    // Phát realtime cho tất cả dashboard
    req.io.emit("location_update", {
      vehicleId,
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      speed: speed_kmh,
      heading: heading
    });

    res.json({ success: true, message: "Cập nhật vị trí thành công" });
  } catch (err) {
    console.error("Lỗi POST /positions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;