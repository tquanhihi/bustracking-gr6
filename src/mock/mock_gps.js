/**
 * mock_gps.js - Simulate real-time GPS position updates for buses
 * Generates random position changes and POSTs them to /api/positions
 * Usage: node src/mock_gps.js
 */

const http = require('http');

// Configuration
const SERVER_HOST = 'localhost';
const SERVER_PORT = 3000;
const API_ENDPOINT = '/api/positions';
const UPDATE_INTERVAL = 5000; // milliseconds (5 seconds)
const STOP_AFTER_UPDATES = 20; // Stop after N updates

// Hanoi city bounds (approximate)
const HANOI_BOUNDS = {
  minLat: 20.8,
  maxLat: 21.2,
  minLng: 105.7,
  maxLng: 106.0
};

// Mock buses (use existing bus_ids from your DB)
const MOCK_BUSES = [
  { bus_id: 1, plate_no: '29A-001', startLat: 21.0, startLng: 105.85 },
  { bus_id: 2, plate_no: '29A-002', startLat: 21.02, startLng: 105.82 },
  { bus_id: 3, plate_no: '29A-003', startLat: 21.01, startLng: 105.88 }
];

// Track current positions
let positions = {};
MOCK_BUSES.forEach(bus => {
  positions[bus.bus_id] = {
    bus_id: bus.bus_id,
    plate_no: bus.plate_no,
    lat: bus.startLat + (Math.random() - 0.5) * 0.01,
    lng: bus.startLng + (Math.random() - 0.5) * 0.01
  };
});

/**
 * POST a position update to the server
 */
function postPosition(position) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      bus_id: position.bus_id,
      lat: position.lat,
      lng: position.lng
    });

    const options = {
      hostname: SERVER_HOST,
      port: SERVER_PORT,
      path: API_ENDPOINT,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, status: res.statusCode, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Generate a slightly updated position (random walk)
 */
function updatePosition(position) {
  const deltaLat = (Math.random() - 0.5) * 0.002;
  const deltaLng = (Math.random() - 0.5) * 0.002;

  let newLat = position.lat + deltaLat;
  let newLng = position.lng + deltaLng;

  // Clamp to Hanoi bounds
  newLat = Math.max(HANOI_BOUNDS.minLat, Math.min(HANOI_BOUNDS.maxLat, newLat));
  newLng = Math.max(HANOI_BOUNDS.minLng, Math.min(HANOI_BOUNDS.maxLng, newLng));

  return {
    bus_id: position.bus_id,
    plate_no: position.plate_no,
    lat: parseFloat(newLat.toFixed(6)),
    lng: parseFloat(newLng.toFixed(6))
  };
}

/**
 * Main loop: update and POST positions at intervals
 */
async function runSimulation() {
  console.log(`\n🚌 Mock GPS Simulator Started`);
  console.log(`📍 Server: http://${SERVER_HOST}:${SERVER_PORT}`);
  console.log(`⏱️  Update interval: ${UPDATE_INTERVAL}ms`);
  console.log(`🔄 Total updates: ${STOP_AFTER_UPDATES}\n`);

  let updateCount = 0;

  const intervalId = setInterval(async () => {
    updateCount++;

    // Update all positions with random walk
    for (const busId in positions) {
      positions[busId] = updatePosition(positions[busId]);

      // POST to server
      try {
        await postPosition(positions[busId]);
        console.log(
          `[${updateCount}] ✅ ${positions[busId].plate_no} @ (${positions[busId].lat.toFixed(4)}, ${positions[busId].lng.toFixed(4)})`
        );
      } catch (err) {
        console.error(`[${updateCount}] ❌ ${positions[busId].plate_no}: ${err.message}`);
      }
    }

    // Stop after N updates
    if (updateCount >= STOP_AFTER_UPDATES) {
      clearInterval(intervalId);
      console.log(`\n✨ Simulation complete (${updateCount} updates sent)\n`);
      process.exit(0);
    }
  }, UPDATE_INTERVAL);
}

// Start
runSimulation().catch((err) => {
  console.error('Simulation error:', err);
  process.exit(1);
});
