const express = require("express");
const router = express.Router();
const { pool } = require("../db");

const isValidPhone = (phone) => /^\d{10,11}$/.test(phone.replace(/[-\s]/g, ""));

router.get("/list", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM drivers ORDER BY driver_id DESC");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error("Lỗi GET /list:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM drivers WHERE driver_id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tài xế" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("Lỗi GET /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { full_name, phone, license_no, status } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ success: false, error: "Tên tài xế bắt buộc" });
  if (!phone || !isValidPhone(phone)) return res.status(400).json({ success: false, error: "SĐT không hợp lệ" });
  if (!license_no?.trim()) return res.status(400).json({ success: false, error: "Bằng lái bắt buộc" });

  try {
    const [result] = await pool.query(
      "INSERT INTO drivers (full_name, phone, license_no, status) VALUES (?, ?, ?, ?)",
      [full_name.trim(), phone, license_no.trim(), status || "active"]
    );

    const newDriver = { driver_id: result.insertId, full_name, phone, license_no, status: status || "active" };
    req.app.get("io")?.emit("driverAdded", newDriver);

    res.status(201).json({ success: true, message: "Thêm tài xế thành công", data: newDriver });
  } catch (err) {
    console.error("Lỗi POST /:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, license_no, status } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ success: false, error: "T�n t�i x? b?t bu?c" });

  try {
    const [result] = await pool.query(
      "UPDATE drivers SET full_name = ?, phone = ?, license_no = ?, status = ? WHERE driver_id = ?",
      [full_name.trim(), phone, license_no, status, id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Không tìm thấy tài xế" });

    const updatedDriver = { driver_id: parseInt(id), full_name, phone, license_no, status };
    req.app.get("io")?.emit("driverUpdated", updatedDriver);

    res.json({ success: true, message: "Cập nhật thành công", data: updatedDriver });
  } catch (err) {
    console.error("Lỗi PUT /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM drivers WHERE driver_id = ?", [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, error: "Kh�ng t�m th?y t�i x?" });

    req.app.get("io")?.emit("driverDeleted", { driver_id: parseInt(req.params.id) });
    res.json({ success: true, message: "Xóa thành công" });
  } catch (err) {
    console.error("Lỗi DELETE /:id:", err);
    res.status(500).json({ success: false, error: "Lỗi server", message: err.message });
  }
});

module.exports = router;
