# Usa uma imagem oficial e leve do Node
FROM node:20-alpine

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os arquivos de dependência primeiro (para otimizar o cache do Docker)
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências
RUN npm install

# Gera o cliente do Prisma (Passo crucial para o banco funcionar no Linux!)
RUN npx prisma generate

# Copia o resto do código da sua API
COPY . .

# Faz o build do NestJS (TypeScript para JavaScript)
RUN npm run build

# O Render vai injetar a porta dinamicamente, mas expomos a 3000 por padrão
EXPOSE 3000

# Comando final que inicia o servidor em produção
CMD ["sh", "-c", "node dist/main.js || node dist/src/main.js"]