import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Schedule } from './schedule.entity'; // Liên kết với Schedule để xác định chuyến đi

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  reportId: number;

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column()
  pickupCount: number; 

  @Column()
  dropoffCount: number; 

  @Column({ nullable: true })
  notes: string;

  // Khóa ngoại tới Driver
  @Column()
  driverId: number;
  
  @ManyToOne(() => Driver, (driver) => driver.reports)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  // Khóa ngoại tới Schedule (Quan trọng hơn Route/Stop riêng lẻ)
  @Column()
  scheduleId: number;

  @ManyToOne(() => Schedule)
  @JoinColumn({ name: 'scheduleId' })
  schedule: Schedule;
}