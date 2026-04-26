import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAvailabilityDto {
  @ApiProperty({ 
    example: false, 
    description: 'Use true para disponível ou false para pausar as vendas' 
  })
  @IsBoolean()
  isAvailable: boolean;
}