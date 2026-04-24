import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    example: 'PREPARING', 
    description: 'PENDING, PREPARING, DELIVERED ou CANCELED' 
  })
  @IsEnum(OrderStatus, { 
    message: 'Status inválido. Use: PENDING, PREPARING, DELIVERED ou CANCELED' 
  })
  status: OrderStatus;
}