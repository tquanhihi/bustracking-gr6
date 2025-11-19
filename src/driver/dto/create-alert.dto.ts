import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export enum AlertType {
  ACCIDENT = 'ACCIDENT',
  BREAKDOWN = 'BREAKDOWN',
  TRAFFIC = 'TRAFFIC',
  OTHER = 'OTHER',
}

export class CreateAlertDto {
  @IsNotEmpty()
  @IsEnum(AlertType)
  alertType: AlertType; // Loại cảnh báo (ví dụ: tai nạn, hỏng hóc, kẹt xe)

  @IsNotEmpty()
  @IsString()
  description: string; // Mô tả chi tiết

  @IsOptional()
  @IsString()
  location?: string; // Vị trí hiện tại
}