import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaModule } from '../prisma/prisma.module'; // <- Importe o módulo

@Module({
  imports: [PrismaModule], // <- Adicione aqui!
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}