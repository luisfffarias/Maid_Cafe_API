import { IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddItemDto {
  @ApiProperty({ example: 'uuid-do-produto-aqui' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  
}