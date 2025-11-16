const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// === VALIDATION HELPER ===
const isValidPhone = (phone) => /^\d{10,11}$/.test(phone.replace(/[-\s]/g, ''));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// === GET: Lấy danh sách ===
router.get('/list', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM parents ORDER BY id DESC");
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Lỗi GET /list:', err);
    res.status(500).json({ success: false, error: 'Lỗi server', message: err.message });
  }
});

// === POST: Thêm mới ===
router.post('/', async (req, res) => {
  const { full_name, phone, email } = req.body;

  // Validation
  if (!full_name?.trim()) return res.status(400).json({ success: false, error: 'Tên không được để trống' });
  if (!phone) return res.status(400).json({ success: false, error: 'SĐT bắt buộc' });
  if (!isValidPhone(phone)) return res.status(400).json({ success: false, error: 'SĐT không hợp lệ (10-11 số)' });
  if (!email) return res.status(400).json({ success: false, error: 'Email bắt buộc' });
  if (!isValidEmail(email)) return res.status(400).json({ success: false, error: 'Email không hợp lệ' });

  try {
    const [result] = await pool.query(
      "INSERT INTO parents (full_name, phone, email) VALUES (?, ?, ?)",
      [full_name.trim(), phone, email]
    );

    const newParent = { id: result.insertId, full_name, phone, email };
    
    // GỬI REALTIME CHO TẤT CẢ CLIENT
    req.app.get('io')?.emit('parentAdded', newParent);

    res.status(201).json({
      success: true,
      message: 'Thêm phụ huynh thành công',
      data: newParent
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Email hoặc SĐT đã tồn tại' });
    }
    console.error('Lỗi POST /:', err);
    res.status(500).json({ success: false, error: 'Lỗi server', message: err.message });
  }
});

// === PUT: Cập nhật ===
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email } = req.body;

  // Validation
  if (!full_name?.trim()) return res.status(400).json({ success: false, error: 'Tên không được để trống' });
  if (!phone || !isValidPhone(phone)) return res.status(400).json({ success: false, error: 'SĐT không hợp lệ' });
  if (!email || !isValidEmail(email)) return res.status(400).json({ success: false, error: 'Email không hợp lệ' });

  try {
    const [result] = await pool.query(
      "UPDATE parents SET full_name = ?, phone = ?, email = ? WHERE id = ?",
      [full_name.trim(), phone, email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });
    }

    const updatedParent = { id: parseInt(id), full_name, phone, email };
    req.app.get('io')?.emit('parentUpdated', updatedParent);

    res.json({ success: true, message: 'Cập nhật thành công', data: updatedParent });
  } catch (err) {
    console.error('Lỗi PUT /:id:', err);
    res.status(500).json({ success: false, error: 'Lỗi server', message: err.message });
  }
});

// === DELETE: Xóa ===
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM parents WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });
    }

    req.app.get('io')?.emit('parentDeleted', { id: parseInt(id) });

    res.json({ success: true, message: 'Xóa thành công' });
  } catch (err) {
    console.error('Lỗi DELETE /:id:', err);
    res.status(500).json({ success: false, error: 'Lỗi server', message: err.message });
  }
});

module.exports = router;