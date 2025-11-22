// routes/parents.js
const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// === VALIDATION HELPER ===
const isValidPhone = (phone) => /^\d{10,11}$/.test((phone || '').replace(/[-\s.]/g, ''));
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');

// === GET: Danh sách + tìm kiếm ===
router.get('/list', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    let sql = 'SELECT parent_id, full_name, phone, email, created_at FROM parents';
    const params = [];

    if (q) {
      sql += ' WHERE parent_id LIKE ? OR full_name LIKE ? OR phone LIKE ? OR email LIKE ?';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY parent_id DESC LIMIT 100';

    const [rows] = await pool.query(sql, params);
    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (err) {
    console.error('Lỗi GET /parents/list:', err);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
});

// === POST: Thêm mới ===
router.post('/', async (req, res) => {
  const { full_name, phone, email } = req.body;

  // Validation
  if (!full_name?.trim()) return res.status(400).json({ success: false, error: 'Họ tên không được để trống' });
  if (!phone?.trim()) return res.status(400).json({ success: false, error: 'Số điện thoại bắt buộc' });
  if (!isValidPhone(phone)) return res.status(400).json({ success: false, error: 'SĐT không hợp lệ (10-11 số)' });
  if (email && !isValidEmail(email)) return res.status(400).json({ success: false, error: 'Email không hợp lệ' });

  try {
    const [result] = await pool.query(
      `INSERT INTO parents (full_name, phone, email) VALUES (?, ?, ?)`,
      [full_name.trim(), phone.trim(), email || null]
    );

    const newParent = {
      parent_id: result.insertId,
      full_name: full_name.trim(),
      phone: phone.trim(),
      email: email || null,
      created_at: new Date()
    };

    // GỬI REALTIME CHO TẤT CẢ CLIENT (Dashboard tự cập nhật ngay lập tức)
    const io = req.app.get('io');
    if (io) io.emit('parentAdded', newParent);

    res.status(201).json({
      success: true,
      message: 'Thêm phụ huynh thành công!',
      data: newParent
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Số điện thoại đã tồn tại!' });
    }
    console.error('Lỗi thêm phụ huynh:', err);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
});

// === PUT: Cập nhật ===
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, phone, email } = req.body;

  if (!full_name?.trim()) return res.status(400).json({ success: false, error: 'Họ tên không được để trống' });
  if (!phone?.trim() || !isValidPhone(phone)) return res.status(400).json({ success: false, error: 'SĐT không hợp lệ' });
  if (email && !isValidEmail(email)) return res.status(400).json({ success: false, error: 'Email không hợp lệ' });

  try {
    const [result] = await pool.query(
      `UPDATE parents SET full_name = ?, phone = ?, email = ? WHERE parent_id = ?`,
      [full_name.trim(), phone.trim(), email || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });
    }

    const updatedParent = { parent_id: parseInt(id), full_name, phone, email: email || null };
    const io = req.app.get('io');
    if (io) io.emit('parentUpdated', updatedParent);

    res.json({ success: true, message: 'Cập nhật thành công!', data: updatedParent });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Số điện thoại đã được dùng cho phụ huynh khác!' });
    }
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
});

// === DELETE: Xóa ===
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Kiểm tra có học sinh liên kết không (nếu có thì không cho xóa)
    const [children] = await pool.query('SELECT 1 FROM students WHERE parent_id = ?', [id]);
    if (children.length > 0) {
      return res.status(400).json({ success: false, error: 'Không thể xóa! Phụ huynh này đang có con đi xe.' });
    }

    const [result] = await pool.query('DELETE FROM parents WHERE parent_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });
    }

    const io = req.app.get('io');
    if (io) io.emit('parentDeleted', { parent_id: parseInt(id) });

    res.json({ success: true, message: 'Xóa phụ huynh thành công!' });
  } catch (err) {
    console.error('Lỗi xóa phụ huynh:', err);
    res.status(500).json({ success: false, error: 'Lỗi server' });
  }
});

module.exports = router;