import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Nossa ponte com o banco!

@Injectable()
export class ProductsService {
  // Injeta o PrismaService no construtor
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
        categoryId: data.categoryId, // Obrigatório: a qual categoria ele pertence?
      },
    });
  }

  // ==========================================
  // LISTAR PRODUTOS (Público/Staff)
  // ==========================================
  async findAll() {
    return this.prisma.product.findMany({
      // O Prisma é mágico: o 'include' faz um JOIN automático
      // e já traz os dados da categoria do produto junto na resposta!
      include: {
        category: true, 
      },
    });
  }

  // ==========================================
  // ALTERAR ESTOQUE (ADMIN e MAIDS)
  // ==========================================
  async updateAvailability(id: string, isAvailable: boolean) {
    // 1. Verifica se o prato/produto realmente existe
    const product = await this.prisma.product.findUnique({ where: { id } });
    
    if (!product) {
      throw new NotFoundException('Produto não encontrado no cardápio.');
    }

    // 2. Atualiza apenas o campo isAvailable
    return this.prisma.product.update({
      where: { id },
      data: { isAvailable },
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