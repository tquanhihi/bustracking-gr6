// =======================================================
// app.js - HỆ THỐNG THEO DÕI XE BUÝT SSB 1.0
// Tác giả: GR6
// Mô tả: Kết nối API thật, mô phỏng realtime, phân quyền
// =======================================================

document.addEventListener('DOMContentLoaded', () => {
  // ==================== KIỂM TRA ĐĂNG NHẬP ====================
  const vaiTro = localStorage.getItem('role');
  if (!vaiTro) {
    alert('Vui lòng đăng nhập!');
    window.location.href = 'login.html';
    return;
  }

  // ==================== CẤU HÌNH TRANG & TIÊU ĐỀ ====================
  const danhSachTrang = [
    'm-dashboard','m-schedules','m-routes','m-tracking','m-messages',
    'd-schedules','d-users','d-reports','d-messages',
    'p-tracking','p-messages','p-reports'
  ];

  const tieuDeTrang = {
    'm-dashboard': 'Tổng quan hệ thống',
    'm-schedules': 'Lịch trình xe',
    'm-routes': 'Phân công tuyến & xe',
    'm-tracking': 'Theo dõi vị trí xe',
    'm-messages': 'Tin nhắn',
    'd-schedules': 'Lịch làm việc',
    'd-users': 'Danh sách học sinh',
    'd-reports': 'Báo cáo đón/trả',
    'd-messages': 'Cảnh báo sự cố',
    'p-tracking': 'Theo dõi xe của con',
    'p-messages': 'Thông báo xe đến gần',
    'p-reports': 'Báo cáo trễ chuyến'
  };

  // ==================== TRẠNG THÁI HỆ THỐNG ====================
  let duLieu = {
    xeBuyt: [],
    tuyenDuong: [],
    tinNhan: [],
    hoatDong: []
  };
  let moPhongDangChay = true;

  // ==================== GỌI API THỰC TẾ TỪ DATABASE ====================
  async function layDuLieuThuc() {
    try {
      const phanHoi = await fetch('http://localhost:3000/api/parents/list');
      const ketQua = await phanHoi.json();

      if (ketQua.success && ketQua.data?.length > 0) {
        console.log('Dữ liệu phụ huynh từ SQL:', ketQua.data);

        // Dùng tên phụ huynh làm tài xế để demo
        duLieu.xeBuyt = ketQua.data.map((phuHuynh, i) => ({
          id: 100 + i,
          bienSo: `29A-${100 + i}`,
          tuyen: i % 2 === 0 ? 'Tuyến A' : 'Tuyến B',
          viDo: 21.02 + Math.random() * 0.02,
          kinhDo: 105.81 + Math.random() * 0.02,
          trangThai: 'running',
          taiXe: phuHuynh.name
        }));

        // Tuyến cố định
        duLieu.tuyenDuong = [
          { id: 1, ten: 'Tuyến A', diemDung: ['Cổng A', 'Điểm 1', 'Điểm 2'] },
          { id: 2, ten: 'Tuyến B', diemDung: ['Cổng B', 'Điểm 3', 'Điểm 4'] }
        ];

        // Cập nhật giao diện
        hienThiDanhSachXe();
        hienThiBanDo();
        capNhatThongKe();
        capNhatBoLoc();
      } else {
        console.warn('Không có dữ liệu phụ huynh');
        hienThiThongBao('Chưa có dữ liệu từ server!');
      }
    } catch (loi) {
      console.error('Lỗi kết nối API:', loi);
      hienThiThongBao('Không thể kết nối đến server! Vui lòng kiểm tra backend.');
    }
  }

  // ==================== CẤU HÌNH PHÂN QUYỀN ====================
  const phanQuyen = {
    manager: { ten: 'Quản lý', trang: ['m-dashboard','m-schedules','m-routes','m-tracking','m-messages'], macDinh: 'm-dashboard' },
    driver:  { ten: 'Tài xế',  trang: ['d-schedules','d-users','d-reports','d-messages'], macDinh: 'd-schedules' },
    parent:  { ten: 'Phụ huynh', trang: ['p-tracking','p-messages','p-reports'], macDinh: 'p-tracking' }
  };

  const quyenHienTai = phanQuyen[vaiTro];
  const hienThiVaiTro = document.getElementById('role-indicator');
  if (hienThiVaiTro) hienThiVaiTro.textContent = quyenHienTai.ten;

  // ==================== ÁP DỤNG PHÂN QUYỀN ====================
  function apDungQuyen() {
    document.querySelectorAll('.sidebar li[data-page]').forEach(li => {
      const trang = li.dataset.page;
      li.style.display = quyenHienTai.trang.includes(trang) ? 'flex' : 'none';
    });

    danhSachTrang.forEach(trang => {
      const view = document.getElementById(trang + '-view');
      if (view) {
        quyenHienTai.trang.includes(trang) ? view.classList.remove('hidden') : view.classList.add('hidden');
      }
    });
  }
  apDungQuyen();

  // ==================== ĐIỀU HƯỚNG TRANG ====================
  function chuyenTrang(trang) {
    danhSachTrang.forEach(t => {
      const view = document.getElementById(t + '-view');
      if (view) view.classList.add('hidden');
    });
    const view = document.getElementById(trang + '-view');
    if (view) view.classList.remove('hidden');

    const tieuDe = document.getElementById('page-title');
    if (tieuDe) tieuDe.textContent = tieuDeTrang[trang] || trang;
  }

  document.querySelectorAll('.sidebar li[data-page]').forEach(li => {
    li.addEventListener('click', () => {
      document.querySelectorAll('.sidebar li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');
      chuyenTrang(li.dataset.page);
    });
  });

  // ==================== HIỂN THỊ DANH SÁCH XE ====================
  function hienThiDanhSachXe() {
    const danhSach = document.getElementById('bus-list');
    if (!danhSach) return;
    danhSach.innerHTML = '';

    duLieu.xeBuyt.forEach(xe => {
      const phanTu = document.createElement('div');
      phanTu.className = 'bus';
      phanTu.innerHTML = `
        <div class="pin">${xe.id}</div>
        <div style="flex:1">
          <div style="font-weight:700">
            ${xe.bienSo}
            <span style="font-size:12px;color:${xe.trangThai==='running'?'#059669':'#6b7280'}">
              ${xe.trangThai === 'running' ? 'Đang chạy' : 'Dừng'}
            </span>
          </div>
          <div class="muted" style="font-size:13px">${xe.tuyen} • ${xe.taiXe}</div>
        </div>`;
      danhSach.appendChild(phanTu);
    });
    capNhatThongKe();
  }

  // ==================== HIỂN THỊ TRÊN BẢN ĐỒ ====================
  function hienThiBanDo() {
    const banDo = document.getElementById('map-items');
    if (!banDo) return;
    banDo.innerHTML = '';

    duLieu.xeBuyt.forEach(xe => {
      const phanTu = document.createElement('div');
      phanTu.className = 'bus';
      phanTu.style.background = 'transparent';
      phanTu.innerHTML = `
        <div class="pin" style="width:28px;height:28px;border-radius:6px">Bus</div>
        <div style="flex:1">
          <div style="font-weight:700">${xe.bienSo}</div>
          <div class="muted" style="font-size:12px">
            ${xe.tuyen} • ${xe.viDo.toFixed(4)}, ${xe.kinhDo.toFixed(4)}
          </div>
        </div>
        <div class="muted" style="font-size:12px">${xe.trangThai}</div>`;
      banDo.appendChild(phanTu);
    });
  }

  // ==================== CẬP NHẬT THỐNG KÊ ====================
  function capNhatThongKe() {
    const tong = document.getElementById('total-buses');
    const dangChay = document.getElementById('running-buses');
    if (tong) tong.textContent = duLieu.xeBuyt.length;
    if (dangChay) dangChay.textContent = duLieu.xeBuyt.filter(x => x.trangThai === 'running').length;
  }

  // ==================== CẬP NHẬT BỘ LỌC TUYẾN ====================
  function capNhatBoLoc() {
    const boLocTuyen = document.getElementById('filter-route');
    const boLocLich = document.getElementById('sched-route');
    if (!boLocTuyen || !boLocLich) return;

    duLieu.tuyenDuong.forEach(tuyen => {
      const tuyChon = document.createElement('option');
      tuyChon.value = tuyen.ten;
      tuyChon.textContent = tuyen.ten;
      boLocTuyen.appendChild(tuyChon);
      boLocLich.appendChild(tuyChon.cloneNode(true));
    });
  }

  // ==================== MÔ PHỎNG REALTIME (3 GIÂY) ====================
  function capNhatMoPhong() {
    if (!moPhongDangChay || duLieu.xeBuyt.length === 0) return;

    duLieu.xeBuyt.forEach(xe => {
      if (Math.random() > 0.85) {
        xe.trangThai = xe.trangThai === 'running' ? 'stopped' : 'running';
      }
      if (xe.trangThai === 'running') {
        xe.viDo += (Math.random() - 0.5) * 0.001;
        xe.kinhDo += (Math.random() - 0.5) * 0.001;
      }
    });

    const xeNgauNhien = duLieu.xeBuyt[Math.floor(Math.random() * duLieu.xeBuyt.length)];
    const hoatDongMoi = `${new Date().toLocaleTimeString()} — ${xeNgauNhien.bienSo} (${xeNgauNhien.tuyen}) ${
      xeNgauNhien.trangThai === 'running' ? 'đang chạy' : 'dừng lại'
    }`;
    duLieu.hoatDong.push(hoatDongMoi);
    if (duLieu.hoatDong.length > 200) duLieu.hoatDong.shift();

    // Cập nhật giao diện
    hienThiDanhSachXe();
    hienThiBanDo();
    capNhatHoatDong();
    capNhatThongKe();
  }

  function capNhatHoatDong() {
    const log = document.getElementById('activity-log');
    if (!log) return;
    log.innerHTML = duLieu.hoatDong.slice().reverse().map(a =>
      `<div style="font-size:13px;padding:6px;border-bottom:1px solid #f3f5f9">${a}</div>`
    ).join('');
  }

  // ==================== GỬI TIN NHẮN ====================
  function guiTinNhan() {
    const den = document.getElementById('msg-to')?.value || 'Tất cả';
    const noiDung = document.getElementById('msg-body')?.value || '—';
    const tin = `${new Date().toLocaleString()} — Gửi tới: ${den} — ${noiDung}`;
    duLieu.tinNhan.push(tin);
    capNhatTinNhan();
    document.getElementById('msg-body').value = '';
  }

  function capNhatTinNhan() {
    const hopThu = document.getElementById('inbox');
    if (!hopThu) return;
    hopThu.innerHTML = duLieu.tinNhan.slice().reverse().map(m =>
      `<div style="padding:6px;border-bottom:1px solid #f3f5f9;font-size:13px">${m}</div>`
    ).join('');
  }

  // ==================== KHỞI TẠO HỆ THỐNG ====================
  function khoiTao() {
    layDuLieuThuc(); // Gọi API ngay khi load

    // Nút bật/tắt mô phỏng
    const nutMoPhong = document.getElementById('btn-simulate');
    if (nutMoPhong) {
      nutMoPhong.addEventListener('click', () => {
        moPhongDangChay = !moPhongDangChay;
        nutMoPhong.textContent = moPhongDangChay ? 'Tắt mô phỏng' : 'Bật mô phỏng';
      });
    }

    // Gửi tin nhắn
    const nutGui = document.getElementById('send-msg');
    if (nutGui) nutGui.addEventListener('click', guiTinNhan);

    // Chuyển về trang mặc định
    chuyenTrang(quyenHienTai.macDinh);

    // Cập nhật realtime mỗi 3 giây
    const socket = io(); // Kết nối Socket.IO

    // Nhận cập nhật realtime từ server
    socket.on("updateBuses", (buses) => {
      state.buses = buses;
      renderBuses();
      updateStats();
      updateMapMarkers(); // Cập nhật Google Maps
    });
      }

  khoiTao();

  // ==================== ĐĂNG XUẤT ====================
  window.dangXuat = function () {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      localStorage.removeItem('role');
      window.location.href = 'login.html';
    }
  };

  // ==================== HIỂN THỊ THÔNG BÁO ====================
  function hienThiThongBao(thongDiep) {
    const container = document.querySelector('.container');
    if (container) {
      const tb = document.createElement('div');
      tb.style.cssText = 'background:#fee2e2;color:#991b1b;padding:12px;border-radius:8px;margin:12px 0;text-align:center;font-weight:500;';
      tb.textContent = thongDiep;
      container.prepend(tb);
    }
  }
});
let map, markers = [];

// Khởi tạo Google Maps
function initMap() {
  map = new google.maps.Map(document.getElementById('google-map'), {
    center: { lat: 21.0285, lng: 105.8342 }, // Hà Nội
    zoom: 12,
    styles: [
      { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
    ]
  });

  // Cập nhật vị trí xe lên bản đồ
  updateMapMarkers();
}

// Cập nhật marker xe
function updateMapMarkers() {
  // Xóa marker cũ
  markers.forEach(m => m.setMap(null));
  markers = [];

  duLieu.xeBuyt.forEach(xe => {
    const marker = new google.maps.Marker({
      position: { lat: xe.viDo, lng: xe.kinhDo },
      map: map,
      title: `${xe.bienSo} - ${xe.taiXe}`,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#059669" stroke="white" stroke-width="2"/>
            <text x="12" y="16" font-family="Arial" font-size="14" fill="white" text-anchor="middle">B</text>
          </svg>
        `),
        scaledSize: new google.maps.Size(32, 32)
      }
    });

    const info = new google.maps.InfoWindow({
      content: `<div style="padding:8px;font-family:sans-serif">
        <b>${xe.bienSo}</b><br>
        Tài xế: ${xe.taiXe}<br>
        Tuyến: ${xe.tuyen}<br>
        Trạng thái: <span style="color:${xe.trangThai==='running'?'#059669':'#6b7280'}">
          ${xe.trangThai === 'running' ? 'Đang chạy' : 'Dừng'}
        </span>
      </div>`
    });

    marker.addListener('click', () => info.open(map, marker));
    markers.push(marker);
  });
}

// Gọi cập nhật bản đồ trong mô phỏng
const oldCapNhatMoPhong = capNhatMoPhong;
capNhatMoPhong = function() {
  oldCapNhatMoPhong();
  if (window.google && map) updateMapMarkers();
};