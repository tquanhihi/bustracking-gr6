import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { Bus } from './bus.entity'; // Cần tạo Entity này
import { Route } from './route.entity'; // Cần tạo Entity này

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  scheduleId: number;

  @Column('date')
  date: Date;

  @Column('time')
  startTime: string;

  @Column('time')
  endTime: string;

  // Khóa ngoại tới Driver
  @Column()
  driverId: number;
  
  @ManyToOne(() => Driver, (driver) => driver.schedules)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;

  // Khóa ngoại tới Bus, Route
  @Column()
  busId: number;

  @Column()
  routeId: number;

  // (Mối quan hệ ManyToOne chi tiết đã lược bỏ để đơn giản)
}