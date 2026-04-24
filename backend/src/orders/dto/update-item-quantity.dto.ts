import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemQuantityDto {
  @ApiProperty({ example: 3, description: 'Nova quantidade do prato' })
  @IsInt()
  @Min(1, { message: 'A quantidade mínima é 1. Para remover, use a rota de exclusão.' })
  quantity: number;
}