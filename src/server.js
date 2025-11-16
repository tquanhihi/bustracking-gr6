require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
let state = { buses: [] }; // Biến toàn cục lưu trạng thái xe

const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// === KẾT NỐI DB ===
const { pool } = require("./db");
console.log("Kết nối DB thành công!");

// === ROUTES ===
const parentsRouter = require("./routes/parents");
const studentsRouter = require("./routes/students");
const driversRouter = require("./routes/drivers");
const busesRouter = require("./routes/buses");
const routesRouter = require("./routes/routes");
const stopsRouter = require("./routes/stops");
const schedulesRouter = require("./routes/schedules");
const assignmentsRouter = require("./routes/assignments");
const positionsRouter = require("./routes/positions");
const messagesRouter = require("./routes/messages");
const pickupRecordsRouter = require("./routes/pickup-records");
const driverReportsRouter = require("./routes/driver-reports");
const notificationsRouter = require("./routes/notifications");

app.use("/api/parents", parentsRouter);
app.use("/api/students", studentsRouter);
app.use("/api/drivers", driversRouter);
app.use("/api/buses", busesRouter);
app.use("/api/routes", routesRouter);
app.use("/api/stops", stopsRouter);
app.use("/api/schedules", schedulesRouter);
app.use("/api/assignments", assignmentsRouter);
app.use("/api/positions", positionsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/pickup-records", pickupRecordsRouter);
app.use("/api/driver-reports", driverReportsRouter);
app.use("/api/notifications", notificationsRouter);

// === PASS IO TO REQUEST OBJECT ===
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

// === HEALTH CHECK ===
app.get("/health", (req, res) => {
  res.json({ status: "OK", time: new Date().toLocaleString("vi-VN") });
});

// === 404 ===
app.use((req, res) => {
  res.status(404).json({ error: "Route không tồn tại" });
});

// === SOCKET.IO REALTIME ===
io.on("connection", (socket) => {
  console.log("Client kết nối:", socket.id);
  socket.emit("updateBuses", state.buses); // Gửi dữ liệu ban đầu

  socket.on("disconnect", () => {
    console.log("Client ngắt kết nối:", socket.id);
  });
});

// === TẢI DỮ LIỆU PHỤ HUYNH → TẠO XE ===
async function loadBuses() {
  try {
    const [rows] = await pool.query("SELECT full_name FROM parents");
    state.buses = rows.map((p, i) => ({
      id: 100 + i,
      plate: `29A-${100 + i}`,
      route: i % 2 === 0 ? "Tuyến A" : "Tuyến B",
      lat: 21.02 + Math.random() * 0.02,
      lon: 105.81 + Math.random() * 0.02,
      status: "running",
      driver: p.full_name
    }));
    io.emit("updateBuses", state.buses);
  } catch (err) {
    console.error("Lỗi load phụ huynh:", err);
  }
}

// Gọi 1 lần khi server khởi động
loadBuses();

// === MÔ PHỎNG REALTIME MỖI 3S ===
setInterval(() => {
  state.buses.forEach(b => {
    if (Math.random() > 0.85) {
      b.status = b.status === "running" ? "stopped" : "running";
    }
    if (b.status === "running") {
      b.lat += (Math.random() - 0.5) * 0.001;
      b.lon += (Math.random() - 0.5) * 0.001;
    }
  });
  io.emit("updateBuses", state.buses);
}, 3000);

// === KHỞI ĐỘNG SERVER ===
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server + Socket.IO chạy tại http://localhost:${PORT}`);
  console.log(`API: GET /api/parents/list`);
});
