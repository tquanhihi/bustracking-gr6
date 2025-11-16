## Mô tả hệ thống

**SSB 1.0** là hệ thống **theo dõi xe buýt học sinh thời gian thực**, hỗ trợ 3 vai trò:

| Vai trò | Chức năng |
|--------|----------|
| **Quản lý** | Tổng quan, lịch trình, phân công xe, theo dõi vị trí, tin nhắn |
| **Tài xế** | Xem lịch làm việc, báo cáo đón/trả, gửi cảnh báo |
| **Phụ huynh** | Theo dõi xe con, nhận thông báo, báo trễ chuyến |

---

## Tính năng nổi bật

- **Realtime tracking** (mô phỏng 3s/lần)
- **Kết nối MySQL thật** (bảng `parents`, `students`)
- **REST API chuẩn** (`/api/parents/list`, `/api/students/list`)
- **Phân quyền role-based** (manager, driver, parent)
- **Responsive UI** (mobile + desktop)
- **Đăng nhập giả lập** (`login.html`)
- **Gửi tin nhắn realtime**

---

## Cấu trúc thư mục
ssb_backend/
├── server.js               # Backend Express
├── db.js                   # Kết nối MySQL (pool)
├── .env                    # Cấu hình DB (KHÔNG NỘP)
├── index.html              # Giao diện chính
├── style.css               # CSS đẹp, responsive
├── app.js                  # JS: API, realtime, role
├── login.html              # Trang đăng nhập
└── routes/
├── parents.js          # API phụ huynh
└── students.js         # API học sinh (bonus)
