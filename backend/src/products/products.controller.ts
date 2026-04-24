import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';

@ApiTags('Produtos / Estoque')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) // Aplica os dois guardas
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: 'Clientes e Staff: Ver o cardápio' })
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @ApiOperation({ summary: 'Apenas Admin: Adicionar novo produto' })
  @Roles(Role.ADMIN) // <--- Bloqueio total
  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @ApiOperation({ summary: 'Admin e Maids: Atualizar disponibilidade de estoque' })
  @Roles(Role.ADMIN, Role.MAID) // <--- Maids podem alterar apenas disponibilidade
  @Patch(':id/availability')
  updateAvailability(@Param('id') id: string, @Body() body: { isAvailable: boolean }) {
    return this.productsService.updateAvailability(id, body.isAvailable);
  }

  @ApiOperation({ summary: 'Apenas Admin: Editar detalhes ou deletar' })
  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}