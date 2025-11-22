const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM routes';
    const params = [];
    if (q) {
      sql += ' WHERE route_name LIKE ? OR description LIKE ?';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY route_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM routes WHERE route_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tuyến" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { route_name, description, estimated_duration_minutes } = req.body;

  if (!route_name?.trim()) return res.status(400).json({ success: false, error: "Tên tuyến bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO routes (route_name, description, estimated_duration_minutes) VALUES (?, ?, ?)",
      [route_name.trim(), description || null, estimated_duration_minutes || null]
    );

    const newRoute = { route_id: result.insertId, route_name, description, estimated_duration_minutes };
    req.app.get("io")?.emit("routeAdded", newRoute);

    res.status(201).json({ success: true, message: "Thêm tuyến thành công", data: newRoute });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { route_name, description, estimated_duration_minutes } = req.body;

  if (!route_name?.trim()) return res.status(400).json({ success: false, error: "Tên tuyến bắt buộc" });

  try {
    const [result] = await pool.query(
      "UPDATE routes SET route_name = ?, description = ?, estimated_duration_minutes = ? WHERE route_id = ?",
      [route_name.trim(), description, estimated_duration_minutes, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tuyến" });

    const updatedRoute = { route_id: parseInt(req.params.id), route_name, description, estimated_duration_minutes };
    req.app.get("io")?.emit("routeUpdated", updatedRoute);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedRoute });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM routes WHERE route_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tuyến" });

    req.app.get("io")?.emit("routeDeleted", { route_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
