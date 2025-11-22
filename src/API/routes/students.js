const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM students';
    const params = [];
    if (q) {
      sql += ' WHERE full_name LIKE ? OR student_code LIKE ?';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY student_id DESC';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Lỗi GET /list:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE student_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy học sinh" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Lỗi GET /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/parent/:parent_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE parent_id = ? ORDER BY student_id DESC", [req.params.parent_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Lỗi GET /parent/:parent_id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { parent_id, full_name, grade, student_code } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ success: false, error: "Tên không được để trống" });
  if (!student_code?.trim()) return res.status(400).json({ success: false, error: "Mã học sinh bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO students (parent_id, full_name, grade, student_code) VALUES (?, ?, ?, ?)",
      [parent_id || null, full_name.trim(), grade || null, student_code.trim()]
    );

    const newStudent = { student_id: result.insertId, parent_id: parent_id || null, full_name, grade, student_code };
    req.app.get("io")?.emit("studentAdded", newStudent);

    res.status(201).json({ success: true, message: "Thêm học sinh thành công", data: newStudent });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ success: false, error: "Mã học sinh đã tồn tại" });
    }
    console.error("Lỗi POST /:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { parent_id, full_name, grade, student_code } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ success: false, error: "Tên không được để trống" });

  try {
    const [result] = await pool.query(
      "UPDATE students SET parent_id = ?, full_name = ?, grade = ?, student_code = ? WHERE student_id = ?",
      [parent_id || null, full_name.trim(), grade || null, student_code, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy học sinh" });
    }

    const updatedStudent = { student_id: parseInt(id), parent_id, full_name, grade, student_code };
    req.app.get("io")?.emit("studentUpdated", updatedStudent);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedStudent });
  } catch (err) {
    console.error("Lỗi PUT /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM students WHERE student_id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Không tìm thấy học sinh" });
    }

    req.app.get("io")?.emit("studentDeleted", { student_id: parseInt(id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    console.error("Lỗi DELETE /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
