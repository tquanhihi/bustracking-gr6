// server.js - GR6 SSB 1.0 (SỬA HOÀN HẢO)

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path"); // ← THÊM DÒNG NÀY

const app = express();

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === CHO PHÉP MỞ FILE TĨNH (index.html, style.css, app.js) ===
// PHẢI ĐẶT TRƯỚC MỌI ROUTE & 404!!!
app.use(express.static(__dirname));

// === KẾT NỐI DB ===
const { pool } = require("./db");
console.log("Kết nối DB thành công!");

// === ROUTES ===
const parentsRouter = require("./routes/parents");
app.use("/api/parents", parentsRouter);

// === HEALTH CHECK ===
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    time: new Date().toLocaleString("vi-VN"),
    server: "GR6 BusTracking SSB 1.0"
  });
});

// === GỢI Ý TRANG CHỦ (TÙY CHỌN) ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// === 404 HANDLER – CHỈ CHẠY KHI KHÔNG CÓ FILE/ROUTE NÀO KHỚP ===
app.use((req, res) => {
  res.status(404).json({ 
    error: "Không tìm thấy trang", 
    path: req.originalUrl,
    hint: "Dùng /index.html để xem giao diện"
  });
});

// === GLOBAL ERROR HANDLER ===
app.use((err, req, res, next) => {
  console.error("Lỗi server:", err.stack);
  res.status(500).json({ 
    error: "Lỗi hệ thống!", 
    message: err.message 
  });
});

// === KHỞI ĐỘNG SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n SERVER GR6 ĐÃ SẴN SÀNG!`);
  console.log(` Giao diện: http://localhost:${PORT}/index.html`);
  console.log(` API:       GET /api/parents/list`);
  console.log(` Health:    GET /health\n`);
});