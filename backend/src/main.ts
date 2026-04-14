import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'; // Importações necessárias
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do Swagger para o seu SMART de documentação
  const config = new DocumentBuilder()
    .setTitle('Maid Café API')
    .setDescription('Sistema de gestão para Maid Café - Entrega FATEC')
    .setVersion('1.0')
    // Adicionaremos .addBearerAuth() aqui futuramente quando fizermos a parte de Segurança
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Isso cria a rota /api

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}/api`);
}
bootstrap();