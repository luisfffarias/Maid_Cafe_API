import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common'; // 1. Importação necessária
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  

  // 2. Ativação da Validação Global (Crucial para os DTOs funcionarem)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos extras que não estão no DTO
      forbidNonWhitelisted: true, // Retorna erro se enviarem campos não permitidos
      transform: true, // Converte tipos automaticamente (ex: string para número se necessário)
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Maid Café API')
    .setDescription('Sistema de gestão para Maid Café - Entrega FATEC')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 MaidInBrazil rodando em: http://localhost:3000/api`);
  
}
console.log('DATABASE_URL:', process.env.DATABASE_URL);
bootstrap();