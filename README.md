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

Mudança no schema: cores nas variações
-------------------------------------------------
Foi adicionada uma nova coluna em `ProdutoVariacao`: `cores` do tipo `String[]` (array de strings). Isso permite que cada variação tenha um conjunto de cores disponíveis (por exemplo: ["preto","branco"]).

O fluxo suportado agora é:
- Ao criar produto (POST /api/products ou /api/products/bulk) cada variação pode receber `cores: ["cor1","cor2"]`.
- Ao consultar produtos (GET /api/products) e produto por id (GET /api/products/:id), a resposta incluirá `variacoes`, e cada variação terá o campo `cores`.

Exemplo: resposta de GET /api/products (lista resumida) — cada produto contém lista de variacoes com cores no objeto completo retornado por /:id, mas a listagem resumida mantém campos principais:

```json
{
    "page": 1,
    "limit": 10,
    "total": 3,
    "totalPages": 1,
    "produtos": [
        {
            "id": "...",
            "nome": "Tênis Runner X",
            "slug": "tenis-runner-x",
            "imagemUrl": "https://...",
            "preco": 349.9,
            "emPromocao": true,
            "precoPromocional": 299.9
        }
    ]
}
```

Exemplo: resposta de GET /api/products/:id (produto completo com variacoes + cores):

```json
{
    "id": "uuid-do-produto",
    "nome": "Tênis Runner X",
    "descricao": "Tênis leve para corrida...",
    "preco": 349.9,
    "emPromocao": true,
    "precoPromocional": 299.9,
    "slug": "tenis-runner-x",
    "imagemUrl": "https://...",
    "categoria": {
        "id": "ec978b1e-d3e9-42d9-9633-eab1f78c0dcf",
        "nome": "Tenis",
        "slug": "tenis"
    },
    "variacoes": [
        {
            "id": "uuid-var-1",
            "tipoTamanho": "NUMERICO",
            "tamanho": "40",
            "estoque": 12,
            "sku": "RUNX-40-BK",
            "cores": ["preto", "branco"],
            "criadoEm": "2026-01-14T00:00:00.000Z"
        },
        {
            "id": "uuid-var-2",
            "tipoTamanho": "NUMERICO",
            "tamanho": "41",
            "estoque": 8,
            "sku": "RUNX-41-BK",
            "cores": ["preto"],
            "criadoEm": "2026-01-14T00:00:00.000Z"
        }
    ]
}
```

Observações:
- O campo `cores` é opcional nas variações; se ausente, será um array vazio no banco.
- Após alterar o schema Prisma foi necessário gerar uma migration e aplicar no banco para que o campo exista fisicamente (veja seção de Prisma / migrations neste README).

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

## ⭐ Avaliações de Produtos (Feedback)

Sistema completo de avaliação de produtos com estrelas e comentários.

### Endpoints de Avaliações

- **POST** `/api/feedback` - Criar avaliação (autenticado, apenas usuários que compraram)
- **GET** `/api/feedback/product/:produtoId` - Listar avaliações de um produto (público)
- **GET** `/api/feedback/product/:produtoId/stats` - Obter estatísticas de avaliação (público)

### Características do Sistema

✅ **Validação de Compra**: Apenas usuários que compraram o produto podem avaliá-lo (verificação via Pedido → PedidoItem)
✅ **Avaliações Quebradas**: Suporta valores de 0.5 em 0.5 (ex: 1.0, 1.5, 2.0, ..., 5.0, 5.5)
✅ **Evita Duplicatas**: Um usuário não pode avaliar o mesmo produto duas vezes
✅ **Atualização Automática**: A média de avaliações é recalculada e atualizada no produto automaticamente
✅ **Comentários Opcionais**: Podem acompanhar a avaliação numérica
✅ **Paginação**: Lista de feedbacks com suporte a paginação
✅ **Estatísticas**: Distribuição de avaliações por número de estrelas

### Criar Avaliação

**Endpoint:**
```
POST /api/feedback
Authorization: Bearer {token_jwt}
Content-Type: application/json
```

**Body:**
```json
{
  "produtoId": "uuid-do-produto",
  "estrelas": 4.5,
  "comentario": "Produto excelente! Recomendo muito."
}
```

**Respostas:**

- `201 Created` - Avaliação criada com sucesso
- `400 Bad Request` - Dados inválidos (estrelas fora do range, incremento errado, comentário muito longo)
- `401 Unauthorized` - Usuário não autenticado
- `403 Forbidden` - Usuário não comprou o produto
- `404 Not Found` - Produto não encontrado
- `409 Conflict` - Usuário já avaliou este produto

### Listar Avaliações

**Endpoint:**
```
GET /api/feedback/product/{produtoId}?page=1&limit=10
```

**Respostas:**

```json
{
  "feedbacks": [
    {
      "id": "uuid",
      "usuarioId": "uuid",
      "produtoId": "uuid",
      "estrelas": 4.5,
      "comentario": "Excelente produto!",
      "criadoEm": "2026-01-14T10:30:00Z",
      "atualizadoEm": "2026-01-14T10:30:00Z",
      "usuario": {
        "id": "uuid",
        "nome": "João Silva"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Obter Estatísticas

**Endpoint:**
```
GET /api/feedback/product/{produtoId}/stats
```

**Resposta:**

```json
{
  "media": 4.35,
  "total": 20,
  "distribution": {
    "0.5": 0,
    "1.0": 0,
    "1.5": 0,
    "2.0": 0,
    "2.5": 1,
    "3.0": 2,
    "3.5": 3,
    "4.0": 5,
    "4.5": 6,
    "5.0": 3,
    "5.5": 0
  }
}
```

### Schema do Banco

O modelo `Feedback` foi adicionado ao schema Prisma com os seguintes campos:

```prisma
model Feedback {
  id              String   @id @default(uuid())
  usuarioId       String
  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  
  produtoId       String
  produto         Produto  @relation(fields: [produtoId], references: [id])
  
  estrelas        Float    // avaliação em estrelas
  comentario      String?  // opcional
  
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt

  @@unique([usuarioId, produtoId])  // Garante unicidade
}
```

O modelo `Produto` também foi atualizado com:
```prisma
estrelas Float @default(0)  // Média das avaliações
feedbacks Feedback[]        // Relacionamento
```

### Validações

**Valores de Estrelas Válidos:**
- 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5

**Comentário:**
- Máximo 1000 caracteres
- Opcional

**Autenticação:**
- Token JWT obrigatório (Bearer token)

**Verificação de Compra:**
- Verifica através de: Pedido → PedidoItem → ProdutoVariacao → Produto
- Apenas pedidos com status `PAGO`, `ENVIADO` ou `ENTREGUE` contam como compra

### Para Testar

1. **Criar um pedido** (via `/api/orders/checkout`)
2. **Marcar como PAGO** (via Mercado Pago ou diretamente no banco)
3. **Criar avaliação** (POST `/api/feedback`)

Ou inserir dados de teste direto no banco:

```sql
INSERT INTO "Pedido" (...) VALUES (...);
INSERT INTO "PedidoItem" (...) VALUES (...);
```

### Documentação Swagger

Acesse a documentação interativa em `http://localhost:3000/api-docs` após iniciar o servidor.

A documentação inclui exemplos de requisição e resposta para todos os endpoints de feedback.

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
