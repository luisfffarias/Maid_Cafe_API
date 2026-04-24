import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Autentication') // Cria uma categoria "Autenticação" no Swagger
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Cadastra um novo funcionário ou usuário' })
  @ApiBody({ 
    schema: { 
      example: { name: 'Gerente', email: 'gerente@maidcafe.com', password: '123', role: 'ADMIN' } 
    } 
  })
  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body.name, body.email, body.password, body.role);
  }

  @ApiOperation({ summary: 'Realiza o login e retorna o Token JWT' })
  @ApiBody({ 
    schema: { 
      example: { email: 'gerente@maidcafe.com', password: '123' } 
    } 
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }
}