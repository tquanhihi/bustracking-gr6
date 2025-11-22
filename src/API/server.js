
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io"); 
const path = require("path");

// KẾT NỐI DB – ĐÚNG RỒI!
const { pool } = require("./db.js");
require('./mock_gps.js');
console.log("Kết nối MySQL thành công!");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } }); 

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../../public")));

// === ROUTES ===
app.use('/api/parents', require('./routes/parents.js'));
app.use('/api/buses', require('./routes/buses.js'));
app.use('/api/positions', require('./routes/positions.js'));
app.use('/api/drivers', require('./routes/drivers.js'));
app.use('/api/routes', require('./routes/routes.js'));
app.use('/api/stops', require('./routes/stops.js'));


app.use((req, res, next) => {
  req.io = io;
  next();
});

// === API CONFIG & HEALTH ===
app.get('/api/config', (req, res) => {
  res.json({
    mapsKey: process.env.GOOGLE_MAPS_KEY || process.env.GOOGLE_MAPS_API_KEY
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'connected', time: new Date().toLocaleString('vi-VN') });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: 'disconnected' });
  }
});

// === LẤY VỊ TRÍ MỚI NHẤT ===
app.get('/api/positions/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        b.bus_id, 
        b.plate_no, 
        b.current_lat AS lat, 
        b.current_lon AS lng, 
        b.last_position_time,
        b.status
      FROM buses b 
      WHERE b.current_lat IS NOT NULL 
        AND b.current_lon IS NOT NULL
      ORDER BY b.last_position_time DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Lỗi /api/positions/latest:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === SOCKET.IO REALTIME ===
io.on("connection", async (socket) => {
  console.log("Client kết nối:", socket.id);

  try {
    const [buses] = await pool.query(`
      SELECT bus_id, plate_no, capacity, status, current_lat, current_lon, last_position_time
      FROM buses WHERE current_lat IS NOT NULL AND current_lon IS NOT NULL
    `);

    socket.emit("current_buses", buses);
  } catch (err) {
    console.error("Lỗi gửi dữ liệu ban đầu:", err);
  }

  socket.on("disconnect", () => {
    console.log("Client ngắt:", socket.id);
  });
});

// === BROADCAST KHI CÓ VỊ TRÍ MỚI (mock_gps.js sẽ gọi hàm này) ===
global.broadcastLocation = (data) => {
  io.emit("positionUpdated", {
    bus_id: data.bus_id,
    plate_no: data.plate_no,
    current_lat: data.current_lat,
    current_lon: data.current_lon,
    speed_kmh: data.speed_kmh || 0,
    last_position_time: data.last_position_time || new Date()
  });
};

// === KHỞI ĐỘNG SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n SERVER SSB 1.0 ĐÃ KHỞI ĐỘNG THÀNH CÔNG!`);
  console.log(` http://localhost:${PORT}`);
  console.log(` Dashboard: http://localhost:${PORT}/admin.html`);
  console.log(` Người dùng: http://localhost:${PORT}/index.html`);
  console.log(` Mock GPS: 10 xe đang chạy tại TP.HCM...\n`);
});