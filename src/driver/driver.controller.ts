import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CreateAlertDto } from './dto/create-alert.dto';
import { AuthGuard } from '@nestjs/passport'; // Giả định dùng Passport/JWT

@Controller('drivers')
@UseGuards(AuthGuard('jwt')) // Yêu cầu xác thực JWT cho tất cả các route
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  /**
   * Lấy driverId từ req.user (do Passport/JWT cung cấp)
   */
  getDriverId(req: any): number {
    return req.user.driverId; 
  }

  // 1. GET /drivers/schedule - Xem lịch làm việc
  @Get('schedule')
  async getSchedule(@Req() req: any) {
    const driverId = this.getDriverId(req);
    const schedules = await this.driverService.getDriverSchedule(driverId);
    
    return { 
        success: true, 
        count: schedules.length,
        data: schedules 
    };
  }

  // 2. POST /drivers/report - Báo cáo đón/trả
  @Post('report')
  async submitReport(@Req() req: any, @Body() createReportDto: CreateReportDto) {
    const driverId = this.getDriverId(req);
    return this.driverService.createPickupDropoffReport(driverId, createReportDto);
  }

  // 3. POST /drivers/alert - Gửi cảnh báo
  @Post('alert')
  async submitAlert(@Req() req: any, @Body() createAlertDto: CreateAlertDto) {
    const driverId = this.getDriverId(req);
    return this.driverService.createAlert(driverId, createAlertDto);
  }
}