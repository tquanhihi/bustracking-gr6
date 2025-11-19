import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from './driver.entity';
import { AlertType } from '../driver/dto/create-alert.dto'; // Tái sử dụng Enum

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  alertId: number;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  alertType: AlertType; 

  @Column('text')
  description: string;

  @Column({ nullable: true })
  location: string; 

  @Column('timestamp with time zone', { default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ default: 'pending' })
  status: string; 

  // Khóa ngoại tới Driver
  @Column()
  driverId: number;
  
  @ManyToOne(() => Driver, (driver) => driver.alerts)
  @JoinColumn({ name: 'driverId' })
  driver: Driver;
}
