import { IsString, IsNotEmpty, IsNumber, IsOptional, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Omurice Mágico', description: 'Nome do prato' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Delicioso omelete com arroz desenhado com ketchup.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 29.90 })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ example: 'https://site.com/omurice.png', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 'COLE-O-UUID-DA-CATEGORIA-AQUI' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  // ========================================================
  // NOVOS CAMPOS PARA CONTROLE DE ESTOQUE
  // ========================================================
  
  @ApiProperty({ example: 10, description: 'Quantidade inicial em estoque', required: false })
  @IsOptional()
  @IsInt({ message: 'O estoque deve ser um número inteiro.' })
  @Min(0, { message: 'O estoque não pode ser negativo.' })
  stock?: number;

  @ApiProperty({ example: true, description: 'Disponível para venda imediata?', required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}