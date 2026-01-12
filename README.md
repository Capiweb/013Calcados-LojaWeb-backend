# 013 Calçados - Backend

Template inicial para API backend de e-commerce de tênis. Este é um boilerplate base que **pode ou não ser usado** no projeto final.

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- PostgreSQL
- npm

### Instalação

```bash
# Clone o repositório
git clone https://github.com/Capiweb/013Calcados-LojaWeb-backend.git
cd 013calcados-back

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Gere o cliente Prisma (requer DATABASE_URL configurado)
npx prisma generate

# Aplicar migrações (opcional) ou sincronizar esquema
# npx prisma migrate dev --name init
# ou
# npx prisma db push

# Inicie o servidor em modo de desenvolvimento
npm run dev
```

## 📁 Estrutura Base
```
src/
├── controllers/      # Controladores
│   ├── auth.controller.js  # Controller de autenticação
│   └── user.js             # Controller de usuários
├── middleware/       # Middlewares
│   └── authMiddleware.js  # Middleware de autenticação JWT
├── repositories/     # Repositórios (acesso ao banco)
│   └── user.repository.js
├── routes/          # Rotas
│   ├── auth.routes.js     # Rotas de autenticação
│   └── user.routes.js     # Rotas de usuários
└── service/         # Lógica de negócio
    ├── auth.service.js    # Service de autenticação
    └── user.js            # Service de usuários
prisma/
├── schema.prisma    # Schema do banco
└── migrations/      # Migrações
index.js             # Entry point
package.json
.env                 # Variáveis de ambiente
```

## 🔧 Stack Tecnológico

- Express.js
- Prisma ORM
- PostgreSQL
- JWT + Bcrypt
- CORS, Cookie Parser
- dotenv

## 📝 Variáveis de Ambiente

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/calcados_db"
JWT_SECRET="sua-chave-secreta-super-segura-aqui"
JWT_EXPIRES_IN="24h"
PORT=3000
NODE_ENV="development"
CORS_ORIGIN_PROD="https://seu-dominio.com"
MP_ACCESS_TOKEN="SEU_TOKEN_DE_ACESSO_MERCADO_PAGO"
MP_BACK_URL_SUCCESS="https://seusite.com/success"
MP_BACK_URL_FAILURE="https://seusite.com/failure"
MP_BACK_URL_PENDING="https://seusite.com/pending"
MP_NOTIFICATION_URL="https://seusite.com/webhook/mp"
```

⚠️ **Importante**: Configure o `JWT_SECRET` com uma chave segura e única antes de iniciar o servidor.

## 🔐 Autenticação

O sistema possui um fluxo completo de autenticação com registro e login de usuários.

### Endpoints de Autenticação

- **POST** `/api/auth/register` - Registro de novo usuário
- **POST** `/api/auth/login` - Login e obtenção de token JWT

Documentação automática (Swagger)

Depois de iniciar o servidor, a documentação interativa está disponível em:

- http://localhost:3000/api-docs

Lá você encontrará todas as rotas (autenticação, produtos, categorias, pedidos, webhooks) e poderá testar as chamadas.

## Produtos

Endpoints de produtos:

- **POST** `/api/products` - Criar um produto (com `variacoes`)
- **POST** `/api/products/bulk` - Criar vários produtos de uma vez (array) — útil para controle de estoque
- **GET** `/api/products` - Listar produtos com filtros e paginação
- **GET** `/api/products/:id` - Obter produto completo por id
- **PUT** `/api/products/:id` - Atualizar produto
- **DELETE** `/api/products/:id` - Deletar produto

> Nota: as operações de escrita (`POST`, `PUT`, `DELETE`, `/bulk`) exigem autenticação e papel `ADMIN`. A listagem (`GET /api/products`) é pública (apenas leitura).

## Categorias

Endpoints de categorias:

- **POST** `/api/categories` - Criar categoria (admin)
- **GET** `/api/categories` - Listar categorias (público)
- **GET** `/api/categories/:id` - Obter categoria por id (público)
- **PUT** `/api/categories/:id` - Atualizar categoria (admin)
- **DELETE** `/api/categories/:id` - Deletar categoria (admin)

Obs: `slug` deve ser único. Operações de escrita exigem autenticação e papel `ADMIN`.

Validação de entrada

As rotas usam Zod para validação de payloads (schemas aplicados via middleware). Erros de validação retornam 400 com a lista de problemas.

## Carrinho e Pedidos

Endpoints de carrinho/pedido (autenticado):

- **GET** `/api/orders/cart` - Obter carrinho do usuário autenticado
- **POST** `/api/orders/cart/items` - Adicionar/atualizar item no carrinho (body: `produtoVariacaoId`, `quantidade`)
- **DELETE** `/api/orders/cart/items/:id` - Remover item do carrinho
- **POST** `/api/orders/checkout` - Criar pedido a partir do carrinho e gerar link de checkout Mercado Pago (body: `endereco`)

Para usar o Mercado Pago é necessário configurar `MP_ACCESS_TOKEN` no `.env`. O fluxo gera uma `preference` via API do Mercado Pago e retorna `init_point` (link de checkout). Após pagamento, você pode configurar `MP_NOTIFICATION_URL` para receber notificações.

Webhooks (notificações)

O endpoint para receber notificações do Mercado Pago está exposto em:

- `POST /webhooks/mercadopago`

Configure a URL pública (por exemplo, usando ngrok em desenvolvimento) e ajuste `MP_NOTIFICATION_URL` nas configurações do Mercado Pago para apontar para ela.

### Query params de filtragem (GET /api/products)

A rota de listagem aceita os seguintes parâmetros de query para filtrar e paginar resultados:

- `page` (number) — página (padrão: 1)
- `limit` (number) — número de itens por página (padrão: 10)
- `categoria` (string) — slug da categoria (ex: `calcados`)
- `emPromocao` (true|false) — filtra produtos com `emPromocao = true` ou `false`
- `precoMin` (number) — preço mínimo (inclusive)
- `precoMax` (number) — preço máximo (inclusive)
- `q` (string) — busca por nome (contains, case-insensitive)
- `tamanho` (string) — filtra produtos que possuem variação com esse tamanho (ex: `40`)
- `emEstoque` (boolean) — quando presente filtra produtos que têm alguma variação com `estoque > 0`

Exemplos de uso:

- Paginação: `/api/products?page=1&limit=10`
- Filtrar por categoria: `/api/products?categoria=calcados`
- Somente produtos em promoção: `/api/products?emPromocao=true`
- Filtrar por faixa de preço: `/api/products?precoMin=200&precoMax=500`
- Buscar por nome: `/api/products?q=runner`
- Filtrar por tamanho: `/api/products?tamanho=40`
- Filtrar produtos com estoque: `/api/products?emEstoque=true`
- Combinação (filtro múltiplo): `/api/products?page=2&limit=12&categoria=calcados&precoMin=200&precoMax=500`
Obs: todos os filtros podem ser combinados. A busca por `tamanho` e `emEstoque` utiliza o relacionamento `variacoes` para verificar presença de tamanhos/estoque.


### Características

- ✅ Criptografia de senhas com bcrypt
- ✅ Validação de dados de entrada
- ✅ Geração de token JWT com expiração configurável
- ✅ Respostas enxutas (sem dados sensíveis)
- ✅ Códigos de status HTTP adequados (400, 401, 409)

Para mais detalhes, consulte [AUTH_API.md](./AUTH_API.md)

## 📖 Documentação Completa

Para detalhes sobre funcionalidades, roadmap e arquitetura do projeto:

- **Tarefas**: [Freedcamp](https://freedcamp.com/view/3693377/tasks/panel/task/68743767)
- **Fluxograma**: Excalidraw anexado no Freedcamp

---

**Template Base v1.0** | Janeiro 2026
