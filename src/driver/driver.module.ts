import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverService } from './driver.service';
import { DriverController } from './driver.controller';

// Entities
import { Driver } from '../entities/driver.entity';
import { Schedule } from '../entities/schedule.entity';
import { Report } from '../entities/report.entity';
import { Alert } from '../entities/alert.entity';

// Import SocketModule để sử dụng SocketGateway
import { SocketModule } from '../socket/socket.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Driver, Schedule, Report, Alert]),
    SocketModule, // Nhập Module chứa SocketGateway
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService, TypeOrmModule], 
})
export class DriverModule {}