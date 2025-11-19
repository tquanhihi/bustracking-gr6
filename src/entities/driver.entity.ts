import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Report } from './report.entity';
import { Alert } from './alert.entity';

@Entity('drivers')
export class Driver {
  @PrimaryGeneratedColumn()
  driverId: number;

  @Column({ length: 100 })
  fullName: string;

  // Giả định thêm trường cho Authentication
  @Column({ select: false }) // Không tự động tải trường này trừ khi được yêu cầu
  passwordHash: string; 

  @Column({ unique: true, length: 20 })
  licenseNo: string; 

  // Mối quan hệ
  @OneToMany(() => Schedule, (schedule) => schedule.driver)
  schedules: Schedule[];
  
  @OneToMany(() => Report, (report) => report.driver)
  reports: Report[];

  @OneToMany(() => Alert, (alert) => alert.driver)
  alerts: Alert[];
}