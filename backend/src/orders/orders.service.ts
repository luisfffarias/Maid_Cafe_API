import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddItemDto } from './dto/add-item.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ====================================================================
  // 1. ADICIONAR ITEM AO CARRINHO
  // ====================================================================
  async addItem(userId: string, addItemDto: AddItemDto) {
    const { productId, quantity } = addItemDto;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) throw new NotFoundException('Produto não encontrado');
    
    // 🚨 TRAVA 1: O produto foi pausado manualmente?
    if (!product.isAvailable) {
      throw new BadRequestException('Este item está temporariamente indisponível.');
    }

    // 🚨 TRAVA 2: Tem estoque suficiente para essa nova adição?
    let currentQuantityInCart = 0;
    
    let openOrder = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.OPEN },
    });

    if (!openOrder) {
      // ANTES DE CRIAR, VERIFICA SE O CLIENTE JÁ ESTÁ SENTADO EM UMA MESA COMENDO ALGO
      const sittingOrder = await this.prisma.order.findFirst({
        where: { 
          userId, 
          status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELED] } // Alterado FINISHED para DELIVERED com base no enum anterior
        },
        orderBy: { createdAt: 'desc' }
      });

      let assignedTable: number;

      if (sittingOrder) {
        // Se ele já tem um pedido ativo (mesmo que entregue), ele continua na mesma mesa!
        assignedTable = sittingOrder.tableNumber;
      } else {
        // Se ele não tem nada ativo, é um cliente novo. Roda o Round Robin!
        assignedTable = await this.getNextAvailableTable();
      }

      // Agora sim, cria o carrinho com a mesa correta
      openOrder = await this.prisma.order.create({
        data: { userId, tableNumber: assignedTable, status: OrderStatus.OPEN },
      });
    }

    const existingItem = await this.prisma.orderItem.findFirst({
      where: { orderId: openOrder.id, productId },
    });

    if (existingItem) {
      currentQuantityInCart = existingItem.quantity;
    }

    if (product.stock < (currentQuantityInCart + quantity)) {
      throw new BadRequestException(`Estoque insuficiente. Restam apenas ${product.stock} unidades.`);
    }

    // ✅ Passou pelas travas! Vamos criar/atualizar o pedido e o item
    if (existingItem) {
      await this.prisma.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.orderItem.create({
        data: {
          orderId: openOrder.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    return this.updateOrderTotal(openOrder.id);
  }

  // ====================================================================
  // 2. VER O CARRINHO
  // ====================================================================
  async getCart(userId: string) {
    const cart = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.OPEN },
      include: { items: { include: { product: true } } },
    });
    
    if (!cart) return { message: 'Carrinho vazio', items: [] };
    return cart;
  }

  // ====================================================================
  // 3. ALTERAR A QUANTIDADE DE UM ITEM NO CARRINHO
  // ====================================================================
  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: { userId, status: OrderStatus.OPEN },
      },
      include: { product: true } 
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no seu carrinho ativo.');
    }

    // 🚨 TRAVA DE ESTOQUE NA EDIÇÃO
    if (item.product.stock < quantity) {
      throw new BadRequestException(`Estoque insuficiente. Restam apenas ${item.product.stock} unidades de ${item.product.name}.`);
    }

    await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.updateOrderTotal(item.orderId);
  }

  // ====================================================================
  // 4. EXCLUIR UM ITEM DO CARRINHO
  // ====================================================================
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: itemId,
        order: { userId, status: OrderStatus.OPEN },
      },
    });

    if (!item) {
      throw new NotFoundException('Item não encontrado no seu carrinho ativo.');
    }

    await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    return this.updateOrderTotal(item.orderId);
  }

  // ====================================================================
  // 5. FINALIZAR PEDIDO (CHECKOUT) E BAIXAR ESTOQUE
  // ====================================================================
  async checkout(userId: string, maidType?: string) { 
    const order = await this.prisma.order.findFirst({
      where: { userId, status: OrderStatus.OPEN },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Nenhum carrinho aberto encontrado.');
    if (order.items.length === 0) throw new BadRequestException('Não é possível finalizar um pedido vazio.');

    for (const item of order.items) {
      const dbProduct = await this.prisma.product.findUnique({ where: { id: item.productId } });
      if (!dbProduct) throw new NotFoundException('Um dos produtos do carrinho não existe mais.');
      if (dbProduct.stock < item.quantity) {
        throw new BadRequestException(`O produto '${dbProduct.name}' esgotou enquanto você montava o pedido!`);
      }
    }

    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity } 
        }
      });
    }

    return this.prisma.order.update({
      where: { id: order.id },
      data: { 
        status: OrderStatus.PENDING,
        maidType: maidType as any 
      },
    });
  }

  // ====================================================================
  // 6. HISTÓRICO DE PEDIDOS DO CLIENTE
  // ====================================================================
  async getUserHistory(userId: string) {
    return this.prisma.order.findMany({
      where: { 
        userId: userId,
        status: { not: OrderStatus.OPEN } 
      },
      orderBy: { createdAt: 'desc' }, 
      include: { 
        items: { 
          include: { product: true } 
        } 
      },
    });
  }

  // ====================================================================
  // 7. VISAO DA EQUIPE: FILA DA COZINHA
  // ====================================================================
  async getQueue() {
    return this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PENDING, OrderStatus.PREPARING],
        },
      },
      orderBy: { createdAt: 'asc' }, 
      include: {
        user: { select: { email: true } }, 
        items: { include: { product: true } },
      },
    });
  }

  // ====================================================================
  // 8. VISAO DA EQUIPE: ATUALIZAR STATUS
  // ====================================================================
  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true }
    });
  }

  // ====================================================================
  // 9. CANCELAMENTO MESTRE (CLIENTE OU STAFF)
  // ====================================================================
  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }, 
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }

    // Regras de Segurança: Diferenciar ações do Cliente vs Ações da Equipe
    if (userRole === 'USER') {
      // 1. O pedido pertence a este usuário?
      if (order.userId !== userId) {
        throw new ForbiddenException('Você só pode cancelar os seus próprios pedidos.');
      }

      // 2. Só pode cancelar se estiver Aguardando (PENDING)
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('O pedido já está a ser preparado ou foi finalizado. Peça ajuda a uma Maid.');
      }
    }

    // Se chegou aqui, ou é o dono (com status PENDING) ou é a equipe limpando a mesa.
    // Só devolvemos o estoque se o pedido NÃO tiver sido entregue.
    if (order.status !== OrderStatus.DELIVERED) {
      for (const item of order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity } 
          }
        });
      }
    }

    // Atualiza o pedido para cancelado
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED }, 
    });
  }

  // ====================================================================
  // FUNÇÃO AUXILIAR: RECALCULAR TOTAL
  // ====================================================================
  private async updateOrderTotal(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
    });

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { total },
      include: { items: { include: { product: true } } }, 
    });
  }

  // ====================================================================
  // FUNÇÃO AUXILIAR: ROUND ROBIN DE MESAS
  // ====================================================================
  private async getNextAvailableTable(): Promise<number> {
    const TOTAL_TABLES = 10; 

    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELED] }, // Alterado FINISHED para DELIVERED
      },
      select: { tableNumber: true },
    });
    
    const occupiedTables = [...new Set(activeOrders.map(o => o.tableNumber))];

    if (occupiedTables.length >= TOTAL_TABLES) {
      throw new BadRequestException('Todas as mesas estão ocupadas no momento. Por favor, aguarde.');
    }

    const lastOrder = await this.prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { tableNumber: true },
    });

    let startTable = lastOrder ? lastOrder.tableNumber : 0;

    for (let i = 1; i <= TOTAL_TABLES; i++) {
      let nextTable = (startTable + i) % TOTAL_TABLES;
      if (nextTable === 0) nextTable = TOTAL_TABLES; 

      if (!occupiedTables.includes(nextTable)) {
        return nextTable;
      }
    }

    throw new Error('Erro ao calcular mesa disponível.');
  }

// ====================================================================
  // 10. LIMPEZA DE LOGOUT (VERIFICAÇÃO DUPLA)
  // ====================================================================
  async logoutCleanup(userId: string) {
    const activeOrders = await this.prisma.order.findMany({
      where: {
        userId,
        status: { in: [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.DELIVERED] },
      },
      include: { items: true },
    });

    for (const order of activeOrders) {
      // REGRA: Se NÃO foi entregue na mesa (está PENDING ou PREPARING) -> CANCELA!
      if (order.status !== OrderStatus.DELIVERED) {
        // Devolve os itens ao estoque
        for (const item of order.items) {
          await this.prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
        // Atualiza o status para cancelado
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.CANCELED },
        });
      } else {
        // REGRA: Se já foi entregue (DELIVERED) -> FINALIZA para liberar a mesa!
        await this.prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.FINISHED },
        });
      }
    }
    
    return { message: 'Mesa liberada e pedidos sincronizados com sucesso!' };
  }
}