const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM schedules';
    const params = [];
    if (q) {
      sql += ' WHERE notes LIKE ?';
      const like = `%${q}%`;
      params.push(like);
    }
    sql += ' ORDER BY schedule_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM schedules WHERE schedule_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy lịch" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { route_id, schedule_date, start_time, end_time, recurrence, notes } = req.body;

  if (!route_id) return res.status(400).json({ success: false, error: "Tuyến bắt buộc" });
  if (!schedule_date) return res.status(400).json({ success: false, error: "Ngày lịch bắt buộc" });
  if (!start_time) return res.status(400).json({ success: false, error: "Giờ bắt đầu bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO schedules (route_id, schedule_date, start_time, end_time, recurrence, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [route_id, schedule_date, start_time, end_time || null, recurrence || "once", notes || null]
    );

    const newSchedule = { schedule_id: result.insertId, route_id, schedule_date, start_time, end_time, recurrence: recurrence || "once", notes };
    req.app.get("io")?.emit("scheduleAdded", newSchedule);

    res.status(201).json({ success: true, message: "Thêm lịch thành công", data: newSchedule });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { route_id, schedule_date, start_time, end_time, recurrence, notes } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE schedules SET route_id = ?, schedule_date = ?, start_time = ?, end_time = ?, recurrence = ?, notes = ? WHERE schedule_id = ?",
      [route_id, schedule_date, start_time, end_time, recurrence, notes, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy lịch" });

    const updatedSchedule = { schedule_id: parseInt(req.params.id), route_id, schedule_date, start_time, end_time, recurrence, notes };
    req.app.get("io")?.emit("scheduleUpdated", updatedSchedule);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedSchedule });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM schedules WHERE schedule_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy lịch" });

    req.app.get("io")?.emit("scheduleDeleted", { schedule_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
