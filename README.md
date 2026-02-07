# 013 Calçados - Backend (Documentação Completa)

Este repositório é um boilerplate/backend para uma loja de calçados (e-commerce). O objetivo deste README é documentar, de forma clara e completa, como o projeto está organizado, como configurar, executar, testar e subir em produção (Render). Também detalha decisões arquiteturais, endpoints principais e notas de segurança e manutenção.

Índice
- Visão geral
- Pré-requisitos
- Instalação e desenvolvimento local
- Prisma: schema, migrations e geração do client (obs: Prisma v6 usado)
- Estrutura do projeto (explicação dos diretórios e arquivos-chave)
- Endpoints principais (detalhados): Auth, Users, Produtos, Categorias, Carrinho/Pedidos, Webhooks
- Validação e segurança (Zod, JWT, roles)
- Swagger (API docs)
- Deploy na Render — comandos recomendados
- Rotina de migrações e deploy seguro
- Como zerar/importar produtos em massa (bulk)
- Dicas de manutenção e próximos passos

---

## Visão geral

- Stack: Node.js (ESM) + Express + Prisma ORM + PostgreSQL + JWT + Zod
- Objetivo: fornecer API REST para gerenciar produtos (com variações), categorias, carrinho, pedidos e checkout via Mercado Pago.
- Observação: o projeto foi mantido compatível com Prisma 6.x no `package.json`. Em ambientes onde o Prisma CLI padrão é 7.x (ex.: Render), os scripts foram pinados para `npx prisma@6.16.2 ...` para evitar incompatibilidades com a sintaxe do schema atual.

---

## Pré-requisitos

- Node.js 18+
- npm
- PostgreSQL (ou Neon/Postgres compatível)
- (Opcional) Conta Mercado Pago para testes de checkout

---

## Instalação e desenvolvimento local

1. Clone o repositório
```bash
git clone https://github.com/Capiweb/013Calcados-LojaWeb-backend.git
cd 013calcados-back
```

2. Instale dependências
```bash
npm install
```

3. Copie variáveis de ambiente e ajuste
```bash
cp .env.example .env
# Abra .env e configure DATABASE_URL, JWT_SECRET, MP_ACCESS_TOKEN etc.
```

4. Gere o Prisma Client (necessário sempre que o schema mudar)
> Observação: este projeto usa Prisma v6 no runtime; usamos `npx prisma@6.16.2` quando necessário.

```bash
npx prisma@6.16.2 generate
```

5. (Desenvolvimento) aplicar migração localmente e abrir servidor
```bash
npx prisma@6.16.2 migrate dev --name init
npx prisma@6.16.2 generate
npm run dev
```

Se preferir sincronizar o schema sem criar migrations (apenas em dev):
```bash
npx prisma@6.16.2 db push
npx prisma@6.16.2 generate
```

---

## Prisma: schema e mudanças importantes

- Arquivo principal: `prisma/schema.prisma`.
- Mudanças recentes importantes:
  - `ProdutoVariacao` agora tem `cores String[]` para armazenar cores disponíveis por variação.
  - Foram adicionados `onDelete: Cascade` em relações críticas para permitir remoções em cascata (Produto -> ProdutoVariacao, ProdutoVariacao -> CarrinhoItem/PedidoItem, Carrinho -> Usuario).
  - Campo `estrelas` corrigido para `Float?`.

Observação sobre versões: O schema usa a sintaxe compatível com Prisma 6. Se for migrar para Prisma 7, revise `datasource` e `prisma.config.ts` conforme a documentação do Prisma 7.

---

## Estrutura do projeto (arquitetura)

- `index.js` — ponto de entrada, registra middlewares, rotas e Swagger.
- `src/routes/` — define rotas por recurso (auth, users, products, categories, orders, webhooks).
- `src/controllers/` — controllers que recebem req/res e usam services.
- `src/service/` — lógica de domínio (orquestra repositórios, regras de negócio).
- `src/repositories/` — acesso direto ao Prisma Client (CRUD simples, queries)
- `src/middleware/` — middlewares (auth, admin check, validate (Zod)).
- `src/validators/` — schemas Zod para validar payloads.
- `src/config/swagger.js` — configuração do swagger-jsdoc para gerar `/api-docs`.

---

## Endpoints principais (detalhados)

Abaixo resumo e detalhes de comportamento, erros e exemplos.

## Rotas e filtros (detalhado)

Abaixo estão as rotas principais com explicação dos parâmetros (query/path/body), exemplos de request e notas de autenticação.

1) Autenticação
- POST /api/auth/register
## Frete (Melhor Envio)

Uma nova rota foi adicionada para cálculo de frete usando a API da Melhor Envio.

- Endpoint: POST /api/shipping/calculate
  - Requer autenticação (Bearer JWT).
  - Body (exemplo mínimo):

```json
{
  "origin_postal_code": "01000-000",
  "destination_postal_code": "02000-000",
  "items": [
    { "weight": 1000, "length": 20, "height": 10, "width": 15, "quantity": 1 }
  ]
}
```

Variáveis de ambiente (adicionar no seu `.env`):

- `MELHOR_ENVIO_TOKEN` - token de autenticação (Bearer) fornecido pela Melhor Envio.
- `MELHOR_ENVIO_CALCULATE_URL` - URL do endpoint de cálculo de frete (opcional). Padrão: `https://api.melhorenvio.com.br/v2/shipment/calculate`.

Notas importantes:
- O backend apenas repassa o payload para a API da Melhor Envio e retorna a resposta. Garanta que o formato do body atenda à especificação da Melhor Envio (principalmente `items` com peso em gramas e dimensões em cm).
- Se sua conta usar um endpoint diferente ou sandbox, configure `MELHOR_ENVIO_CALCULATE_URL` adequadamente.

  - Body (JSON): { nome, email, senha, confirmarSenha }
  - Regras: senha mínimo 6 caracteres; senha e confirmarSenha devem bater.
  - Respostas:
    - 201: criado { message, user: { nome, email } }
    - 400: erro de validação (Zod) — resposta contém detalhes
    - 409: email já cadastrado
  - Autenticação: pública

- POST /api/auth/login
  - Body (JSON): { email, senha }
  - Respostas:
    - 200: { token, user }
    - 401: credenciais inválidas
  - Autenticação: pública

2) Produtos
- GET /api/products
  - Query params (todos opcionais):
    - page (number) — página (default: 1)
    - limit (number) — itens por página (default: 10)
    - q (string) — busca por nome (contains, case-insensitive)
    - categoria (string) — slug da categoria (ex: tenis)
    - emPromocao (boolean) — true/false
    - precoMin (number) — preço mínimo (inclusive)
    - precoMax (number) — preço máximo (inclusive)
    - tamanho (string) — filtra produtos que possuem variação com esse tamanho (ex: "40")
    - emEstoque (boolean) — se true, retorna produtos com alguma variação com estoque > 0
  - Exemplo:
    - /api/products?page=2&limit=12&categoria=tenis&precoMin=200&precoMax=500&q=runner
  - Resposta 200: { page, limit, total, totalPages, produtos: [ { id, nome, slug, imagemUrl, preco, emPromocao, precoPromocional } ] }
  - Autenticação: pública

- GET /api/products/:id
  - Path param: id (uuid)
  - Retorna produto completo com `categoria` e `variacoes`.
  - Cada variação contém: { id, tipoTamanho, tamanho, estoque, sku, cores: string[] }
  - Exemplo de resposta: veja seção "Mudança no schema" no README.
  - Autenticação: pública

- POST /api/products
  - Body (JSON) exemplo (ver `ProductCreate` schema no Swagger):
    - nome, descricao, preco, slug, imagemUrl, categoriaId (uuid), variacoes: [ { tipoTamanho, tamanho, estoque, sku, cores?: [] } ]
  - Resposta: 201 com objeto criado
  - Autenticação: Bearer token com papel ADMIN

- POST /api/products/bulk
  - Body: array de `ProductCreate` — tudo é criado em transação (ou aborta em erro)
  - Autenticação: ADMIN

- PUT /api/products/:id
  - Body: campos a atualizar (produto e/ou variacoes). Nota: atualmente a atualização de variações é direta; ao enviar `variacoes` considere a estratégia de sincronização (implementar se necessário).
  - Autenticação: ADMIN

- DELETE /api/products/:id
  - Autenticação: ADMIN
  - Com `onDelete: Cascade` no schema, variações e itens relacionados são removidos automaticamente no banco.

3) Categorias
- GET /api/categories
  - Lista todas as categorias (público).

- POST /api/categories
  - Body: { nome, slug }
  - Autenticação: ADMIN

- GET /api/categories/:id
  - Retorna categoria por id

- PUT /api/categories/:id
  - Autenticação: ADMIN

- DELETE /api/categories/:id
  - Autenticação: ADMIN

4) Carrinho / Pedidos
- GET /api/orders/cart
  - Retorna o carrinho do usuário autenticado, incluindo itens com `produtoVariacao` e `produto` resumido.
  - Autenticação: Bearer token

- POST /api/orders/cart/items
  - Body: { produtoVariacaoId: string, quantidade: number }
  - Se o item existir, atualiza quantidade; caso contrário, cria.
  - Resposta: item do carrinho atualizado/criado
  - Autenticação: Bearer token

- DELETE /api/orders/cart/items/:id
  - Remove item do carrinho do usuário autenticado
  - Autenticação: Bearer token

- POST /api/orders/checkout
  - Body: { endereco: { rua, numero, complemento?, bairro, cidade, estado, cep } }
  - Cria o pedido a partir do carrinho e gera preference do Mercado Pago; retorna link (`init_point`) e `preference_id`.
  - Autenticação: Bearer token

5) Webhooks
- POST /webhooks/mercadopago
  - Recebe notificações do Mercado Pago. O corpo depende do tipo de notificação. O serviço mapeia status externo para `StatusPagamento` interno.
  - IMPORTANTE: proteja/valide esse endpoint (verificar assinatura, IPs, idempotência). Atualmente está em forma básica.

6) Usuários (admin/dev)
- POST /api/users/register (ou usar /api/auth/register) — criar usuário
- GET /api/users/users — listar usuários (pode ser protegido conforme sua necessidade)
- GET /api/users/users/:id — obter por id
- PUT /api/users/users/:id — atualizar
- DELETE /api/users/users/:id — deletar

Notas gerais de filtros e comportamento
- Combinações de filtros em /api/products são AND (todos os filtros se aplicam juntos).
- `tamanho` e `emEstoque` consultam o relacionamento `variacoes` (ex.: where { variacoes: { some: { tamanho: query.tamanho } } }).
- `q` busca por `nome` (contains, case-insensitive) — não faz stem ou normalização além de case-insensitive.
- Campos de preço no schema são `Decimal` no Prisma; a API converte para números no JSON.

Exemplos rápidos de uso (curl)
- Listar produtos página 1, 10 por página:
```bash
curl "http://localhost:3000/api/products?page=1&limit=10"
```
- Buscar produtos em promoção na categoria "tenis" entre 200 e 400:
```bash
curl "http://localhost:3000/api/products?categoria=tenis&emPromocao=true&precoMin=200&precoMax=400"
```
- Criar produto (admin):
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "nome": "Tênis X", "descricao": "...", "preco": 199.99, "slug": "tenis-x", "imagemUrl": "https://...", "categoriaId": "ec978b1e-d3e9-42d9-9633-eab1f78c0dcf", "variacoes": [{ "tipoTamanho": "NUMERICO", "tamanho": "40", "estoque": 10, "sku": "TENX-40", "cores": ["preto"] }] }'
```


### Autenticação
- POST /api/auth/register
  - Body: `{ nome, email, senha, confirmarSenha }`
  - Validação: Zod + regra no controller para `senha === confirmarSenha`.
  - Retorno: 201 com user (sem senha) ou 409 se email já existe.

- POST /api/auth/login
  - Body: `{ email, senha }`
  - Retorno: 200 `{ token, user }` ou 401 credenciais inválidas.

- GET /api/auth/check — valida token (Bearer ou cookie)
- GET /api/auth/isAdmin — retorna `isAdmin: true|false`

### Usuários
- Rota padrão em `src/routes/user.routes.js` (CRUD básico). Proteja endpoints sensíveis conforme necessário.

### Produtos
- POST /api/products (admin) — cria produto com `variacoes`.
- POST /api/products/bulk (admin) — cria múltiplos produtos (array) em transação.
- GET /api/products — listagem pública com filtros (categoria, q, precoMin/Max, tamanho, emEstoque, emPromocao), paginação (`page`, `limit`). Retorna `ProductListResponse`.
- GET /api/products/:id — produto completo, inclui `categoria` e `variacoes` (cada variação traz `cores` como array de strings). Retorna `ProductDetailResponse`.
- PUT /api/products/:id (admin) — atualiza o produto. Nota: atualização de variações precisa de cuidado (pode ser substituição completa ou update por id). Atualmente o serviço faz update direto; para atualização de variações complexas recomendo implementar uma transação que sincronize variações (apagar/recriar ou atualizar por `sku`).
- DELETE /api/products/:id (admin) — deleta produto; com cascade as variações e itens relacionados são limpos pelo banco.

Exemplo de criação de variação com cores:
```json
{
  "tipoTamanho": "NUMERICO",
  "tamanho": "40",
  "estoque": 12,
  "sku": "RUNX-40-BK",
  "cores": ["preto", "branco"]
}
```

### Categorias
- CRUD básico em `/api/categories`.
- `slug` deve ser único.

### Carrinho e Pedidos
- GET /api/orders/cart — retorna carrinho do usuário autenticado (itens com produto/variação)
- POST /api/orders/cart/items — adicionar/atualizar item (produtoVariacaoId, quantidade)
- DELETE /api/orders/cart/items/:id — remover item
- POST /api/orders/checkout — cria pedido a partir do carrinho e gera preference do Mercado Pago (retorna `init_point`)
 - POST /api/orders/checkout — cria pedido a partir do carrinho e gera preference do Mercado Pago (retorna `init_point`)
   - Observação nova: o backend agora reaproveita um pedido com status `PENDENTE` para o mesmo usuário. Ou seja, se o usuário gerar a preferência do Mercado Pago mais de uma vez sem pagar, o mesmo pedido será utilizado (itens e total são sincronizados com o carrinho), evitando múltiplos pedidos duplicados.
 - GET /api/orders/admin — lista todos os pedidos (apenas ADMIN). Query params opcionais: `status` (ex: PENDENTE, APROVADO), `userId` (uuid)

Novos endpoints relacionados a pedidos e pagamentos

- DELETE /api/orders/{id}
  - Deleta um pedido por id. Usuário só pode deletar seus próprios pedidos; ADMIN pode deletar qualquer pedido.
  - Retorno: 200 { ok: true } ou 403/404 conforme o caso.

- DELETE /api/orders/user/{userId}
  - Deleta todos os pedidos pertencentes a um usuário. Pode ser executado pelo próprio usuário ou por ADMIN.
  - Retorno: 200 { ok: true, deleted: <count> }.

Note: A rota PUT /api/orders/{id}/freight foi removida. Agora, ao criar o checkout você deve enviar o valor do frete no body do POST /api/orders/checkout como `{ "frete": number }`. O backend irá somar o frete ao total do pedido na criação.

- DELETE /api/orders/payments/{pagamentoId}
  - Deleta um registro de pagamento pelo campo `pagamentoId` salvo no DB (id retornado pelo provedor, ex: Mercado Pago). Somente dono do pedido ou ADMIN.

- DELETE /api/orders/payments/user/{userId}
  - Deleta todos os registros de pagamento associados aos pedidos de um usuário (ADMIN ou o próprio usuário podem executar).

Notas de uso e segurança
- As rotas novas exigem autenticação (JWT). O `authMiddleware` valida token via cookie `token` ou header Authorization.
- As remoções são permanentes no banco (Prisma `deleteMany` / `delete`). Se você preferir soft-delete, posso ajustar o schema e a lógica para marcar registros como `deletedAt` em vez de remover.
- Ao adicionar frete via PUT, o valor é somado ao campo `total`. Se preferir, podemos adicionar um campo `frete` separado em `Pedido` (recomendado) e expor o `subtotal` + `frete` como `total` calculado.

### Favoritos

- POST /api/favorites
  - Adiciona um produto aos favoritos do usuário autenticado.
  - Body: { produtoId: string }
  - Resposta: 201 Created com o registro criado.
  - Autenticação: Bearer token (veja nota sobre cabeçalhos abaixo).

- GET /api/favorites
  - Lista os produtos favoritados pelo usuário autenticado.
  - Retorna array de produtos com campos: { id, nome, preco, slug, imagemUrl }.
  - Autenticação: Bearer token.

- DELETE /api/favorites/:produtoId
  - Remove o produto dos favoritos do usuário autenticado.
  - Autenticação: Bearer token.

Nota importante sobre autenticação e cabeçalhos:

- Este projeto suporta autenticação via cookie (`token`) e via header HTTP Authorization. Para chamadas API (por exemplo, usando curl, Postman ou do frontend), passe o JWT no header Authorization com o esquema Bearer:

```bash
Authorization: Bearer <SEU_JWT>
```

Algumas rotas podem também aceitar um cookie `token` com o JWT; o middleware `authMiddleware` verifica ambos (cookie `token` ou header Authorization). Nos exemplos e na documentação do Swagger, prefira usar o header Authorization para clareza.

Observações sobre estoque e pagamento:
- Stock decrement é realizado quando uma notificação de pagamento `APROVADO` é recebida via webhook (configurado em `/webhooks/mercadopago`).
- Webhook precisa ser configurado no painel do Mercado Pago apontando para `POST /webhooks/mercadopago`.

Exemplo (admin) — listar pedidos pendentes:
```bash
curl "http://localhost:3000/api/orders/admin?status=PENDENTE" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Webhooks
- POST /webhooks/mercadopago — processa notificações do Mercado Pago. Atualmente há uma implementação básica que deve ser endurecida (verificação de assinatura, idempotência, e mapeamento de status).

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
