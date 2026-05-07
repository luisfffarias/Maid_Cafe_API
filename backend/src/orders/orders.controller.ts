import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemQuantityDto } from './dto/update-item-quantity.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'; 
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard'; 
import { Roles } from '../auth/decorators/roles.decorator'; 
import { Role } from '@prisma/client'; 

@ApiTags('Pedidos / Carrinho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Adicionar item ao carrinho' })
  @Post('cart')
  addItem(@Req() req, @Body() addItemDto: AddItemDto) {
    // Pegamos o id do usuário direto do token
    return this.ordersService.addItem(req.user.userId, addItemDto);
  }

  @ApiOperation({ summary: 'Ver meu carrinho atual' })
  @Get('cart')
  getCart(@Req() req) {
    return this.ordersService.getCart(req.user.userId);
  }

  @ApiOperation({ summary: 'Alterar a quantidade de um prato no carrinho' })
  @Patch('cart/item/:itemId')
  updateItemQuantity(
    @Req() req,
    @Param('itemId') itemId: string,
    @Body() updateItemQuantityDto: UpdateItemQuantityDto,
  ) {
    return this.ordersService.updateItemQuantity(
      req.user.userId,
      itemId,
      updateItemQuantityDto.quantity,
    );
  }

  @ApiOperation({ summary: 'Remover um prato do carrinho' })
  @Delete('cart/item/:itemId')
  removeItem(@Req() req, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(req.user.userId, itemId);
  }

  @ApiOperation({ summary: 'Finalizar pedido (Enviar para a cozinha)' })
  @Post('checkout')
  checkout(@Req() req, @Body('maidType') maidType?: string) {
    return this.ordersService.checkout(req.user.userId, maidType);
  }

  @ApiOperation({ summary: 'Ver meu histórico de pedidos (Tudo exceto o carrinho atual)' })
  @Get('history')
  getUserHistory(@Req() req) {
    // Usando req.user.userId conforme configurado na sua Strategy
    return this.ordersService.getUserHistory(req.user.userId);
  }

  @ApiOperation({ summary: 'Staff: Ver fila de pedidos da cozinha' })
  @Roles(Role.ADMIN, Role.MAID) // Apenas Admin e Maids acessam!
  @Get('queue')
  getQueue() {
    return this.ordersService.getQueue();
  }

  @ApiOperation({ summary: 'Staff: Atualizar status (Ex: PENDING -> PREPARING)' })
  @Roles(Role.ADMIN, Role.MAID) // Apenas Admin e Maids acessam!
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string, 
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto.status);
  }

  // 👇 Rota Atualizada para o Cancelamento Mestre!
  @ApiOperation({ summary: 'Cancelar pedido (Cliente ou Staff)' })
  @Patch(':id/cancel')
  cancelOrder(
    @Param('id') id: string, 
    @Req() req
  ) {
    // req.user.userId e req.user.role vêm do seu JWT (AuthGuard)
    return this.ordersService.cancelOrder(id, req.user.userId, req.user.role);
  }

  @ApiOperation({ summary: 'Limpar mesa e pedidos ao fazer logout' })
  @Post('logout-cleanup')
  logoutCleanup(@Req() req) {
    return this.ordersService.logoutCleanup(req.user.userId);
  }
}