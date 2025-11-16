const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pickup_records ORDER BY record_id DESC LIMIT 500");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.get("/student/:student_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM pickup_records WHERE student_id = ? ORDER BY action_time DESC", [req.params.student_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { schedule_id, stop_id, student_id, bus_id, driver_id, action, remark } = req.body;

  if (!schedule_id || !student_id || !action) return res.status(400).json({ success: false, error: "Thông tin bắt buộc" });

  try {
    const action_time = new Date();
    const [result] = await pool.query(
      "INSERT INTO pickup_records (schedule_id, stop_id, student_id, bus_id, driver_id, action, action_time, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [schedule_id, stop_id || null, student_id, bus_id || null, driver_id || null, action, action_time, remark || null]
    );

    const newRecord = { 
      record_id: result.insertId, 
      schedule_id, 
      stop_id, 
      student_id, 
      bus_id, 
      driver_id, 
      action, 
      action_time, 
      remark 
    };
    req.app.get("io")?.emit("pickupRecordAdded", newRecord);

    res.status(201).json({ success: true, message: "Ghi nhận thành công", data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM pickup_records WHERE record_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy ghi nhận" });

    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
