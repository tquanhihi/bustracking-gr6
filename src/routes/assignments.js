const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM assignments ORDER BY assignment_id DESC");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM assignments WHERE assignment_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy phân công" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { schedule_id, bus_id, driver_id } = req.body;

  if (!schedule_id || !bus_id || !driver_id) return res.status(400).json({ success: false, error: "Thông tin bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO assignments (schedule_id, bus_id, driver_id) VALUES (?, ?, ?)",
      [schedule_id, bus_id, driver_id]
    );

    const newAssignment = { assignment_id: result.insertId, schedule_id, bus_id, driver_id };
    req.app.get("io")?.emit("assignmentAdded", newAssignment);

    res.status(201).json({ success: true, message: "Thêm phân công thành công", data: newAssignment });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { schedule_id, bus_id, driver_id } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE assignments SET schedule_id = ?, bus_id = ?, driver_id = ? WHERE assignment_id = ?",
      [schedule_id, bus_id, driver_id, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy phân công" });

    const updatedAssignment = { assignment_id: parseInt(req.params.id), schedule_id, bus_id, driver_id };
    req.app.get("io")?.emit("assignmentUpdated", updatedAssignment);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedAssignment });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM assignments WHERE assignment_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy phân công" });

    req.app.get("io")?.emit("assignmentDeleted", { assignment_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
