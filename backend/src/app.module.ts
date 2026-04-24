import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module'; // 1. Importe o Módulo, não o Serviço
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    PrismaModule, // 2. Registre o PrismaModule nos imports
    UsersModule, AuthModule, ProductsModule, CategoriesModule, OrdersModule
  ],
  controllers: [AppController],
  providers: [AppService], // 3. Remova o PrismaService daqui
})
export class AppModule {}