import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../entities/driver.entity';
import { Schedule } from '../entities/schedule.entity';
import { Report } from '../entities/report.entity';
import { Alert } from '../entities/alert.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  /**
   * Xem lịch làm việc của tài xế
   */
  async getDriverSchedule(driverId: number) {
    const schedules = await this.scheduleRepository.find({
      where: { driverId: driverId, date: new Date().toISOString().split('T')[0] as any }, 
      relations: ['bus', 'route'], 
      order: { startTime: 'ASC' },
    });

    if (!schedules || schedules.length === 0) {
      // Có thể trả về mảng rỗng thay vì NotFoundException nếu muốn báo lịch trống
      return []; 
    }

    return schedules;
  }

  /**
   * Báo cáo đón/trả khách tại điểm dừng cụ thể trong một chuyến
   */
  async createPickupDropoffReport(driverId: number, createReportDto: CreateReportDto) {
    // 1. Kiểm tra xem chuyến đi có thuộc về tài xế không (Logic bảo mật quan trọng)
    const schedule = await this.scheduleRepository.findOne({ 
        where: { 
            scheduleId: createReportDto.scheduleId, 
            driverId: driverId 
        } 
    });

    if (!schedule) {
        throw new NotFoundException(`Không tìm thấy chuyến đi ID ${createReportDto.scheduleId} hoặc nó không được giao cho tài xế này.`);
    }

    const newReport = this.reportRepository.create({
      driverId: driverId,
      ...createReportDto, // scheduleId, stopId, pickupCount, dropoffCount, notes
    });

    await this.reportRepository.save(newReport);

    return { 
        message: 'Báo cáo đón/trả thành công', 
        report: newReport 
    };
  }

  /**
   * Gửi cảnh báo khẩn cấp/sự cố
   */
  async createAlert(driverId: number, createAlertDto: CreateAlertDto) {
    const newAlert = this.alertRepository.create({
      driverId: driverId,
      ...createAlertDto, // alertType, description, location
      status: 'pending', // Mặc định là đang chờ xử lý
    });

    await this.alertRepository.save(newAlert);
    
    // TODO: Gửi sự kiện real-time đến Admin/Dispatcher (thường dùng NestJS Gateway/Socket.IO)

    return { 
        message: 'Cảnh báo đã được gửi thành công', 
        alert: newAlert 
    };
  }
}