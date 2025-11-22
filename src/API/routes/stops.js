const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM stops';
    const params = [];
    if (q) {
      sql += ' WHERE stop_name LIKE ?';
      const like = `%${q}%`;
      params.push(like);
    }
    sql += ' ORDER BY stop_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.get("/route/:route_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM stops WHERE route_id = ? ORDER BY sequence_no", [req.params.route_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { route_id, stop_name, lat, lon, sequence_no } = req.body;

  if (!stop_name?.trim()) return res.status(400).json({ success: false, error: "Tên điểm dừng bắt buộc" });
  if (!lat || !lon) return res.status(400).json({ success: false, error: "Tọđ bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO stops (route_id, stop_name, lat, lon, sequence_no) VALUES (?, ?, ?, ?, ?)",
      [route_id, stop_name.trim(), lat, lon, sequence_no || 0]
    );

    const newStop = { stop_id: result.insertId, route_id, stop_name, lat, lon, sequence_no: sequence_no || 0 };
    req.app.get("io")?.emit("stopAdded", newStop);

    res.status(201).json({ success: true, message: "Thêm điểm dừng thành công", data: newStop });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { route_id, stop_name, lat, lon, sequence_no } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE stops SET route_id = ?, stop_name = ?, lat = ?, lon = ?, sequence_no = ? WHERE stop_id = ?",
      [route_id, stop_name, lat, lon, sequence_no, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy điểm dừng" });

    const updatedStop = { stop_id: parseInt(req.params.id), route_id, stop_name, lat, lon, sequence_no };
    req.app.get("io")?.emit("stopUpdated", updatedStop);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedStop });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM stops WHERE stop_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy điểm dừng" });

    req.app.get("io")?.emit("stopDeleted", { stop_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
