import { PartialType } from '@nestjs/swagger'; // IMPORTANTE: usar o do Swagger
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}