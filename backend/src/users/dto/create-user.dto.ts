import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';

export enum Role {
  USER = 'USER',
  MAID = 'MAID',
  ADMIN = 'ADMIN',
}

export class CreateUserDto {
  @ApiProperty({ example: 'Hwei Artist' }) // Aparece como dica no Swagger
  @IsString()
  name: string;

  @ApiProperty({ example: 'hwei@maidinbrazil.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: Role, default: Role.USER }) // Campo opcional na documentação
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}