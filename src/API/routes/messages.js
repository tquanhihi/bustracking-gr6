const express = require("express");
const router = express.Router();
const { pool } = require("../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM messages';
    const params = [];
    if (q) {
      sql += ' WHERE message_text LIKE ?';
      params.push(`%${q}%`);
    }
    sql += ' ORDER BY message_id DESC LIMIT 500';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM messages WHERE message_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tin nhắn" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { to_type, to_id, from_type, from_id, message_text } = req.body;

  if (!to_type || !to_id || !message_text?.trim()) return res.status(400).json({ success: false, error: "Thông tin bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO messages (to_type, to_id, from_type, from_id, message_text) VALUES (?, ?, ?, ?, ?)",
      [to_type, to_id, from_type || "system", from_id || null, message_text.trim()]
    );

    const newMessage = { message_id: result.insertId, to_type, to_id, from_type: from_type || "system", from_id, message_text, is_read: 0 };
    req.app.get("io")?.emit("messageAdded", newMessage);

    res.status(201).json({ success: true, message: "Gửi tin nhắn thành công", data: newMessage });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id/read", async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE messages SET is_read = 1 WHERE message_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tin nhắn" });

    res.json({ success: true, message: "Không dấu đã đọc" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM messages WHERE message_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tin nhắn" });

    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
