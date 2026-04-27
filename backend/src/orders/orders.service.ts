import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
          status: { notIn: [OrderStatus.FINISHED, OrderStatus.CANCELED] } 
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

    if (product.stock < (currentQuantityInCart + quantity)) {
      throw new BadRequestException(`Estoque insuficiente. Restam apenas ${product.stock} unidades.`);
    }

    // ✅ Passou pelas travas! Vamos criar/atualizar o pedido e o item
    if (!openOrder) {
      // 1. Verifica se o cliente JÁ ESTÁ em uma mesa (pedidos anteriores não finalizados)
      const sittingOrder = await this.prisma.order.findFirst({
        where: { 
          userId, 
          status: { notIn: ['FINISHED', 'CANCELED'] } // Mantém a mesa se ele ainda estiver comendo
        },
        orderBy: { createdAt: 'desc' }
      });

      // Variável temporária para guardar a mesa escolhida
      let assignedTable: number;

      if (sittingOrder) {
        // Se ele já está comendo, herda a mesa que ele já estava!
        assignedTable = sittingOrder.tableNumber;
      } else {
        // Se é um cliente totalmente novo, O ROUND ROBIN ESCOLHE A MESA AQUI!
        assignedTable = await this.getNextAvailableTable(); 
      }

      // 2. Agora sim, criamos o carrinho passando a mesa que o backend calculou
      openOrder = await this.prisma.order.create({
        data: { 
          userId, 
          tableNumber: assignedTable, // <-- Olha o Prisma recebendo o número correto aqui!
          status: 'OPEN' // (Se você usar o Enum, troque para OrderStatus.OPEN)
        },
      });
    }

    const existingItem = await this.prisma.orderItem.findFirst({
      where: { orderId: openOrder.id, productId },
    });

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
      include: { product: true } // Precisamos do produto para verificar o estoque!
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
  async checkout(userId: string) {
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
      data: { status: OrderStatus.PENDING },
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
    const TOTAL_TABLES = 10; // Defina quantas mesas existem no Maid Café

    // 1. Descobre quais mesas estão ocupadas agora (qualquer pedido que NÃO seja FINISHED ou CANCELED)
    const activeOrders = await this.prisma.order.findMany({
      where: {
        status: { notIn: [OrderStatus.FINISHED, OrderStatus.CANCELED] },
      },
      select: { tableNumber: true },
    });
    
    // 👇 CORREÇÃO AQUI: Cria um array com os números ÚNICOS das mesas ocupadas.
    // O Set garante que, se a Mesa 1 tiver 10 pedidos ativos, ela conte como apenas 1 mesa ocupada.
    const occupiedTables = [...new Set(activeOrders.map(o => o.tableNumber))];

    // Se a casa estiver cheia, barra o sistema
    if (occupiedTables.length >= TOTAL_TABLES) {
      throw new BadRequestException('Todas as mesas estão ocupadas no momento. Por favor, aguarde.');
    }

    // 2. Descobre qual foi a ÚLTIMA mesa a ser designada no restaurante
    const lastOrder = await this.prisma.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { tableNumber: true },
    });

    let startTable = lastOrder ? lastOrder.tableNumber : 0;

    // 3. ROUND ROBIN: Tenta a próxima mesa, girando em loop se chegar no máximo
    for (let i = 1; i <= TOTAL_TABLES; i++) {
      let nextTable = (startTable + i) % TOTAL_TABLES;
      if (nextTable === 0) nextTable = TOTAL_TABLES; // Para evitar a "Mesa 0"

      // Se essa mesa não estiver no array de ocupadas, achamos a vencedora!
      if (!occupiedTables.includes(nextTable)) {
        return nextTable;
      }
    }

    throw new Error('Erro ao calcular mesa disponível.');
  }
}