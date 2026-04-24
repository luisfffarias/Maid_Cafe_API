import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ 
    example: 'Bebidas Mágicas', 
    description: 'Nome da categoria de produtos' 
  })
  @IsString()
  @IsNotEmpty({ message: 'O nome da categoria não pode estar vazio' })
  @MinLength(3, { message: 'O nome deve ter pelo menos 3 caracteres' })
  name: string;
}