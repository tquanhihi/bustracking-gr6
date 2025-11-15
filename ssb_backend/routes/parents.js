// routes/parents.js - QUẢN LÝ DỮ LIỆU PHỤ HUYNH
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// === GET: Lấy danh sách tất cả phụ huynh ===
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM parents");
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('Lỗi truy vấn danh sách phụ huynh:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi lấy danh sách phụ huynh',
      message: err.message
    });
  }
});

// === POST: Thêm mới phụ huynh ===
router.post('/', async (req, res) => {
  const { full_name, phone, email } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!full_name || !phone || !email) {
    return res.status(400).json({
      success: false,
      error: 'Dữ liệu không hợp lệ',
      message: 'Vui lòng cung cấp full_name, phone và email'
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO parents (full_name, phone, email) VALUES (?, ?, ?)",
      [full_name, phone, email]
    );

    res.status(201).json({
      success: true,
      message: 'Thêm phụ huynh thành công',
      id: result.insertId,
      data: { full_name, phone, email }
    });
  } catch (err) {
    console.error('Lỗi thêm phụ huynh:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi server khi thêm phụ huynh',
      message: err.message
    });
  }
});

module.exports = router;