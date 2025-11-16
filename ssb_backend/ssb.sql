CREATE DATABASE IF NOT EXISTS ssb;
USE ssb;
DROP database ssb;

-- BẢNG parents
CREATE TABLE parents (
  parent_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- BẢNG students
CREATE TABLE students (
  student_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT,
  full_name VARCHAR(150) NOT NULL,
  grade VARCHAR(20),
  student_code VARCHAR(50) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(parent_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- BẢNG drivers
CREATE TABLE drivers (
  driver_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20),
  license_no VARCHAR(50),
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- BẢNG buses
CREATE TABLE buses (
  bus_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  plate_no VARCHAR(30) UNIQUE NOT NULL,
  capacity INT DEFAULT 30,
  description VARCHAR(255),
  current_lat DECIMAL(10,7),
  current_lon DECIMAL(10,7),
  last_position_time DATETIME,
  status ENUM('active','maintenance','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- BẢNG routes
CREATE TABLE routes (
  route_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_name VARCHAR(150) NOT NULL,
  description TEXT,
  estimated_duration_minutes INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- BẢNG stops
CREATE TABLE stops (
  stop_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  stop_name VARCHAR(150) NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lon DECIMAL(10,7) NOT NULL,
  sequence_no INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- BẢNG schedules
CREATE TABLE schedules (
  schedule_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  route_id BIGINT NOT NULL,
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  recurrence ENUM('once','daily','weekly','monthly') DEFAULT 'once',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(route_id) ON DELETE CASCADE,
  UNIQUE (route_id, schedule_date, start_time)
) ENGINE=InnoDB;

-- BẢNG assignments
CREATE TABLE assignments (
  assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  bus_id BIGINT NOT NULL,
  driver_id BIGINT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE RESTRICT,
  UNIQUE (schedule_id, bus_id)
) ENGINE=InnoDB;

-- BẢNG real_time_positions
CREATE TABLE real_time_positions (
  position_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_id BIGINT NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lon DECIMAL(10,7) NOT NULL,
  speed_kmh DECIMAL(5,2),
  heading DECIMAL(6,2),
  reported_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE,
  INDEX (bus_id, reported_at)
) ENGINE=InnoDB;

-- BẢNG messages
CREATE TABLE messages (
  message_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  to_type ENUM('driver','parent') NOT NULL,
  to_id BIGINT NOT NULL,
  from_type ENUM('system','driver','parent') DEFAULT 'system',
  from_id BIGINT,
  message_text TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- BẢNG pickup_records
CREATE TABLE pickup_records (
  record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  schedule_id BIGINT NOT NULL,
  stop_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  bus_id BIGINT,
  driver_id BIGINT,
  action ENUM('picked_up','dropped_off') NOT NULL,
  action_time DATETIME NOT NULL,
  remark VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(stop_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE SET NULL,
  INDEX (student_id, action_time)
) ENGINE=InnoDB;

-- BẢNG driver_reports
CREATE TABLE driver_reports (
  report_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  driver_id BIGINT NOT NULL,
  schedule_id BIGINT,
  bus_id BIGINT,
  report_type VARCHAR(100),
  description TEXT,
  report_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('new','acknowledged','resolved') DEFAULT 'new',
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- BẢNG notifications
CREATE TABLE notifications (
  notif_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  parent_id BIGINT,
  driver_id BIGINT,
  bus_id BIGINT,
  notif_type VARCHAR(100),
  content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_sent TINYINT(1) DEFAULT 0,
  FOREIGN KEY (parent_id) REFERENCES parents(parent_id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(driver_id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- STORED PROCEDURE: CẬP NHẬT VỊ TRÍ XE
DELIMITER $$
CREATE PROCEDURE sp_update_bus_position(
  IN p_bus_id BIGINT,
  IN p_lat DECIMAL(10,7),
  IN p_lon DECIMAL(10,7),
  IN p_speed DECIMAL(5,2),
  IN p_heading DECIMAL(6,2),
  IN p_reported_at DATETIME
)
BEGIN
  INSERT INTO real_time_positions(bus_id, lat, lon, speed_kmh, heading, reported_at, created_at)
  VALUES (p_bus_id, p_lat, p_lon, p_speed, p_heading, p_reported_at, NOW());

  UPDATE buses
  SET current_lat = p_lat,
      current_lon = p_lon,
      last_position_time = p_reported_at
  WHERE bus_id = p_bus_id;
END $$
DELIMITER ;
