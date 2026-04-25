import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 👇 ADICIONE ESTA LINHA: Habilita o CORS para o Front-end conseguir conectar!
  app.enableCors();

  // Ativação da Validação Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Maid Café API')
    .setDescription('Sistema de gestão para Maid Café - Entrega FATEC')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
  console.log(`🚀 MaidInBrazil rodando em: http://localhost:${process.env.PORT || 3000}/api`);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL);
bootstrap();