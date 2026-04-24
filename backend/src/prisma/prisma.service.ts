import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Busca a URL do seu Supabase (injetada pelo dotenvx)
    const connectionString = process.env.DATABASE_URL;
    
    // Cria o pool de conexões utilizando o driver nativo do Postgres
    const pool = new Pool({ connectionString });
    
    // Instancia o adaptador do Prisma
    const adapter = new PrismaPg(pool);

    // O Prisma 7 agora recebe o adapter obrigatório para inicializar
    super({ adapter }); 
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}