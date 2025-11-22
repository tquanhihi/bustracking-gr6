// src/mock/mock_gps.js
// MÔ PHỎNG 10 XE BUÝT CHẠY REALTIME TẠI TP.HCM
// Dùng Socket.IO để phát trực tiếp (nhanh hơn POST HTTP)
// Chạy tự động khi server khởi động

require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const { pool } = require('../API/db.js'); // Đường dẫn đúng tới db.js

console.log('MOCK GPS: 10 xe buýt đang chạy tại TP.HCM...');

// === CẤU HÌNH ===
const UPDATE_INTERVAL = 5000; // 5 giây cập nhật 1 lần
const NUM_BUSES = 10;

// Khu vực TP.HCM
const HCM_BOUNDS = {
  minLat: 10.70,
  maxLat: 10.85,
  minLng: 106.60,
  maxLng: 106.80
};

// Danh sách 10 xe mẫu
const BUSES = Array.from({ length: NUM_BUSES }, (_, i) => ({
  bus_id: i + 1,
  plate_no: `51B-${String(100 + i).padStart(3, '0')}.00`,
  lat: 10.76 + (Math.random() - 0.5) * 0.05,
  lng: 106.66 + (Math.random() - 0.5) * 0.05
}));

// Lưu vị trí hiện tại
let currentPositions = { ...BUSES.reduce((acc, bus) => {
  acc[bus.bus_id] = { ...bus };
  return acc;
}, {}) };

// Hàm phát vị trí qua Socket.IO (toàn server)
let io = null;
function broadcastPosition(data) {
  if (io) {
    io.emit('positionUpdated', data);
    console.log(`[LIVE] ${data.plate_no} → ${data.current_lat.toFixed(6)}, ${data.current_lon.toFixed(6)} | ${data.speed_kmh} km/h`);
  }
}

// Hàm cập nhật vị trí ngẫu nhiên + lưu DB + phát realtime
async function updateAllBuses() {
  for (const bus of BUSES) {
    const pos = currentPositions[bus.bus_id];

    // Di chuyển ngẫu nhiên (tối đa ~300m mỗi lần)
    const deltaLat = (Math.random() - 0.5) * 0.003;
    const deltaLng = (Math.random() - 0.5) * 0.003;

    pos.lat += deltaLat;
    pos.lng += deltaLng;

    // Giữ trong TP.HCM
    pos.lat = Math.max(HCM_BOUNDS.minLat, Math.min(HCM_BOUNDS.maxLat, pos.lat));
    pos.lng = Math.max(HCM_BOUNDS.minLng, Math.min(HCM_BOUNDS.maxLng, pos.lng));

    // Tính tốc độ giả lập
    const speed_kmh = Math.round(Math.random() * 70);

    // Cập nhật vào DB
    try {
      await pool.query(
        `UPDATE buses 
         SET current_lat = ?, current_lon = ?, speed_kmh = ?, last_position_time = NOW()
         WHERE bus_id = ?`,
        [pos.lat, pos.lng, speed_kmh, bus.bus_id]
      );

      // Phát realtime qua Socket.IO
      const updateData = {
        bus_id: bus.bus_id,
        plate_no: bus.plate_no,
        current_lat: parseFloat(pos.lat.toFixed(6)),
        current_lon: parseFloat(pos.lng.toFixed(6)),
        speed_kmh: speed_kmh,
        last_position_time: new Date().toISOString()
      };

      broadcastPosition(updateData);
    } catch (err) {
      console.error('Lỗi cập nhật GPS:', err.message);
    }
  }
}

// === KẾT NỐI VỚI SERVER CHÍNH (server.js) ===
function attachToServer(server) {
  io = new Server(server, {
    cors: { origin: "*" }
  });

  console.log('Socket.IO đã kết nối với mock GPS!');

  // Bắt đầu mock ngay lập tức
  updateAllBuses(); // lần đầu
  setInterval(updateAllBuses, UPDATE_INTERVAL);
}

// Export để server.js gọi
module.exports = { attachToServer };