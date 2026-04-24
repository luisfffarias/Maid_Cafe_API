import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'; // Importação essencial para a criptografia

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  // ==========================================
  // ROTA DE LOGIN
  // ==========================================
  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // 1. Verifica se o usuário existe
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // 2. Valida a senha usando o Bcrypt para comparar o texto puro com o hash salvo
    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    // 3. Monta o payload
    const payload = { 
      sub: user.id, 
      email: user.email,
      role: user.role 
    };
    
    // 4. Assina e devolve o token
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  // ==========================================
  // ROTA DE CADASTRO (REGISTER)
  // ==========================================
  async register(name: string, email: string, pass: string, role?: 'USER' | 'MAID' | 'ADMIN') {
    // 1. Verifica se o e-mail já existe no banco
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    
    if (userExists) {
      throw new BadRequestException('Este e-mail já está em uso.');
    }

    // 2. Criptografa a senha antes de salvar
    const hashedPassword = await bcrypt.hash(pass, 10);

    // 3. Salva o novo usuário no Supabase
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'USER', // Se não enviar cargo, vira USER por padrão
      },
    });

    // 4. Retorna os dados do usuário removendo a senha por segurança
    const { password, ...result } = newUser;
    return result;
  }
}