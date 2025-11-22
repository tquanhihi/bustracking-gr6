const express = require("express");
const router = express.Router();
const { pool } = require("../../db");

router.get("/list", async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT * FROM notifications';
    const params = [];
    if (q) {
      sql += ' WHERE content LIKE ? OR notif_type LIKE ?';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY notif_id DESC LIMIT 500';
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.get("/parent/:parent_id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE parent_id = ? ORDER BY created_at DESC", [req.params.parent_id]);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { parent_id, driver_id, bus_id, notif_type, content } = req.body;

  if (!notif_type || !content?.trim()) return res.status(400).json({ success: false, error: "Thông tin bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO notifications (parent_id, driver_id, bus_id, notif_type, content) VALUES (?, ?, ?, ?, ?)",
      [parent_id || null, driver_id || null, bus_id || null, notif_type, content.trim()]
    );

    const newNotif = { 
      notif_id: result.insertId, 
      parent_id, 
      driver_id, 
      bus_id, 
      notif_type, 
      content,
      is_sent: 0
    };
    req.app.get("io")?.emit("notificationAdded", newNotif);

    res.status(201).json({ success: true, message: "TẠo thông báo thành công", data: newNotif });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.put("/:id/send", async (req, res) => {
  try {
    const [result] = await pool.query(
      "UPDATE notifications SET is_sent = 1 WHERE notif_id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy thông báo" });

    res.json({ success: true, message: "G?i th�ng b�o th�nh c�ng" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM notifications WHERE notif_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy thông báo" });

    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    res.status(500).json({ success: false, error: "L?i server", message: err.message });
  }
});

module.exports = router;
