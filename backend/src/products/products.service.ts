import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CRIAR PRODUTO (Apenas ADMIN)
  // ==========================================
  async create(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId, 
        stock: data.stock, // <-- Adicionado para garantir que salve
        isAvailable: data.isAvailable, // <-- Adicionado para garantir que salve
      },
    });
  }

  // ==========================================
  // LISTAR PRODUTOS (Público/Staff)
  // ==========================================
  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true, 
      },
    });
  }

  // ==========================================
  // ATUALIZAR PRODUTO (Estoque, Preço, etc)
  // ==========================================
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Produto não encontrado no cardápio.');
    }

    // O Prisma é inteligente e atualiza apenas os campos que vieram no DTO
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  // ==========================================
  // DELETAR PRODUTO (Apenas ADMIN)
  // ==========================================
  async remove(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Produto não encontrado no cardápio.');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}