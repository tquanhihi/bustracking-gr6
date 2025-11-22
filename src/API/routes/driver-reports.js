const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM driver_reports';
    const params = [];
    if (q) {
      sql += ' WHERE report_type LIKE ? OR description LIKE ?';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY report_id DESC LIMIT 500';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/driver/:driver_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM driver_reports WHERE driver_id = ? ORDER BY report_time DESC", [req.params.driver_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { driver_id, schedule_id, bus_id, report_type, description } = req.body;

  if (!driver_id || !report_type) return res.status(400).json({ success: false, error: "Thông tin bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO driver_reports (driver_id, schedule_id, bus_id, report_type, description) VALUES (?, ?, ?, ?, ?)",
      [driver_id, schedule_id || null, bus_id || null, report_type, description || null]
    );

    const newReport = { 
      report_id: result.insertId, 
      driver_id, 
      schedule_id, 
      bus_id, 
      report_type, 
      description,
      status: "new"
    };
    req.app.get("io")?.emit("reportAdded", newReport);

    res.status(201).json({ success: true, message: "Báo cáo thành công", data: newReport });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id/status", async (req, res) => {
  const { status } = req.body;

  if (!status) return res.status(400).json({ success: false, error: "" });

  try {
    const [result] = await pool.query(
      "UPDATE driver_reports SET status = ? WHERE report_id = ?",
      [status, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy báo cáo" });

    res.json({ success: true, message: "Cập nhật trạng thái thành công", status });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM driver_reports WHERE report_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy báo cáo" });

    res.json({ success: true, message: "Xóa thành công!" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
