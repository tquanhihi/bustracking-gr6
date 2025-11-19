import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsNumber()
  scheduleId: number; // ID lịch làm việc (chuyến đi) đang thực hiện

  @IsNotEmpty()
  @IsNumber()
  stopId: number; // ID điểm dừng

  @IsNumber()
  pickupCount: number; // Số lượng khách đón

  @IsNumber()
  dropoffCount: number; // Số lượng khách trả

  @IsOptional()
  @IsString()
  notes?: string;
}