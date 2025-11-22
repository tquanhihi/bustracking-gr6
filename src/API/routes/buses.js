const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM buses';
    const params = [];
    if (q) {
      sql += ' WHERE plate_no LIKE ? OR description LIKE ?';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY bus_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Lỗi GET /list:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM buses WHERE bus_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy xe" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Lỗi GET /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { plate_no, capacity, description, status } = req.body;

  if (!plate_no?.trim()) return res.status(400).json({ success: false, error: "Biển số xe bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO buses (plate_no, capacity, description, status) VALUES (?, ?, ?, ?)",
      [plate_no.trim(), capacity || 30, description || null, status || "active"]
    );

    const newBus = { bus_id: result.insertId, plate_no, capacity: capacity || 30, description, status: status || "active" };
    req.app.get("io")?.emit("busAdded", newBus);

    res.status(201).json({ success: true, message: "Thêm xe thành công", data: newBus });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ success: false, error: "Biển số xe đã tồn tại" });
    console.error("Lỗi POST /:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { plate_no, capacity, description, status } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE buses SET plate_no = ?, capacity = ?, description = ?, status = ? WHERE bus_id = ?",
      [plate_no, capacity, description, status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy xe" });

    const updatedBus = { bus_id: parseInt(id), plate_no, capacity, description, status };
    req.app.get("io")?.emit("busUpdated", updatedBus);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedBus });
  } catch (err) {
    console.error("Lỗi PUT /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM buses WHERE bus_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy xe" });

    req.app.get("io")?.emit("busDeleted", { bus_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    console.error("Lỗi DELETE /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
