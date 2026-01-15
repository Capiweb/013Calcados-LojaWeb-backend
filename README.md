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
 - GET /api/orders/admin — lista todos os pedidos (apenas ADMIN). Query params opcionais: `status` (ex: PENDENTE, APROVADO), `userId` (uuid)

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

## Filtros disponíveis para /api/orders/admin

A rota `GET /api/orders/admin` aceita vários filtros via query string. Abaixo descrevo cada filtro possível, exemplos de uso e como ele é mapeado internamente para um objeto `where` do Prisma.

- `status` (string) — filtra pelo status do pedido (enum `StatusPedido`). Valores válidos: `PENDENTE`, `PAGO`, `CANCELADO`, `ENVIADO`, `ENTREGUE`.
  - Exemplo: `?status=PENDENTE`
  - Prisma where: { status: 'PENDENTE' }

- `statusPagamento` (string) — filtra pelo status do pagamento associado (enum `StatusPagamento`). Valores: `PENDENTE`, `APROVADO`, `REJEITADO`, `REEMBOLSADO`.
  - Exemplo: `?statusPagamento=APROVADO`
  - Prisma where (relacional): { pagamento: { status: 'APROVADO' } }

- `paymentId` (string) — filtra pelo `pagamento.pagamentoId` (ID do provedor, ex.: Mercado Pago).
  - Exemplo: `?paymentId=1234567890`
  - Prisma where: { pagamento: { pagamentoId: '1234567890' } }

- `userId` (uuid) — filtra pedidos feitos por um usuário específico.
  - Exemplo: `?userId=ec978b1e-d3e9-42d9-9633-eab1f78c0dcf`
  - Prisma where: { usuarioId: '...' }

- `orderId` (uuid) — filtra por ID do pedido.
  - Exemplo: `?orderId=...`
  - Prisma where: { id: '...' }

- `produtoVariacaoId` (uuid) — filtra pedidos que contenham ao menos um item com a variação informada.
  - Exemplo: `?produtoVariacaoId=...`
  - Prisma where (relacional): { itens: { some: { produtoVariacaoId: '...' } } }

- `precoMin` / `precoMax` (number) — filtra por `total` do pedido (inclusive).
  - Exemplo: `?precoMin=100&precoMax=500`
  - Prisma where: { total: { gte: 100, lte: 500 } }

- `cidade` / `estado` / `cep` — filtra por campos de endereço congelado no pedido.
  - Exemplo: `?cidade=São Paulo&estado=SP`
  - Prisma where: { cidade: 'São Paulo', estado: 'SP' }

- `dateFrom` / `dateTo` (ISO date) — filtra por `criadoEm` entre intervalos.
  - Exemplo: `?dateFrom=2025-01-01&dateTo=2025-01-31`
  - Prisma where: { criadoEm: { gte: new Date(dateFrom), lte: new Date(dateTo) } }

- `statuses` (csv) — filtrar por múltiplos status de uma vez.
  - Exemplo: `?statuses=PENDENTE,PAGO`
  - Prisma where: { status: { in: ['PENDENTE','PAGO'] } }

- `include` (string) — controla includes opcionais separados por vírgula (ex.: `include=usuario,pagamento,itens`). Por padrão a rota inclui `itens` e `pagamento`.
  - Nota: incluir `usuario` adiciona dados do usuário ao retorno.

- `page` / `limit` (number) — paginação. Ex.: `?page=2&limit=20`. Internamente se traduz em `skip: (page-1)*limit, take: limit`.

- `orderBy` (string) — ordenação, formato `campo:dir` (ex.: `orderBy=criadoEm:desc` ou `orderBy=total:asc`).

Combinações
- Todos os filtros podem ser combinados — aplicam-se em AND. Exemplos:
  - Pedidos pendentes de um usuário entre datas: `?userId=...&status=PENDENTE&dateFrom=2025-01-01&dateTo=2025-01-31`
  - Pedidos que contenham uma variação específica e com pagamento aprovado: `?produtoVariacaoId=...&statusPagamento=APROVADO`

Performance e segurança
- Filtrar por campos relacionais (`itens.some`, `pagamento`) pode gerar queries mais pesadas; para listas muito grandes utilize paginação (`page`/`limit`).
- Sempre use a rota com autenticação e `adminMiddleware`. Evite expor filtros sensíveis sem checagem de papel.

Exemplos práticos (curl)
- Pedidos do usuário X entre 1 e 31 de dezembro de 2025, ordenados pelo total descendente:
```bash
curl "http://localhost:3000/api/orders/admin?userId=ec978b1e-d3e9-42d9-9633-eab1f78c0dcf&dateFrom=2025-12-01&dateTo=2025-12-31&orderBy=total:desc&page=1&limit=50" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

- Pedidos que contenham a variação `abc-variacao-id` e cujo pagamento foi aprovado:
```bash
curl "http://localhost:3000/api/orders/admin?produtoVariacaoId=abc-variacao-id&statusPagamento=APROVADO" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Implementação (dica rápida)
- No controller atual os parâmetros `status` e `userId` já são mapeados para `where`. Para suportar todos os filtros acima, implemente um construtor de `where` que:
  - converta `dateFrom/dateTo` em objetos Date;
  - converta `precoMin/precoMax` para Decimal/Number;
  - parseie `statuses` CSV para `in`;
  - adicione relacionais (pagamento, itens) quando os filtros correspondentes estiverem presentes;
  - aplique `skip`/`take` para paginação e `orderBy` quando fornecido.

Se quiser, eu implemento a validação Zod dos query params e a versão completa do construtor de `where` no `order.controller` e `order.service` — quer que eu implemente agora? 

---

## Validação e segurança

- Zod é usado para validação de payloads (produtos, categorias, checkout, auth); middleware `validate` aplica os schemas.
- JWT no header `Authorization: Bearer <token>` ou cookie `token`.
- Middleware `adminMiddleware` para proteger rotas de escrita (criar/editar/deletar produtos e categorias).
- Senhas: bcrypt com hash seguro.

---

## Swagger (Documentação)
- Documentação disponível em `/api-docs` quando o servidor está rodando.
- O Swagger foi atualizado para incluir `variacoes[].cores` nos schemas de produto.

---

## Deploy na Render (comandos recomendados)

Seu ambiente mostrou incompatibilidade de versões do Prisma (Render usa CLI Prisma 7.x por padrão). Para evitar erros, o `package.json` contém scripts que invocam `npx prisma@6.16.2 ...`.

Recomendações no painel da Render (Service settings):
- Build Command: `npm run build`  (gera Prisma Client: `npx prisma@6.16.2 generate`)
- Pre-Deploy Command: `npx prisma@6.16.2 migrate deploy`  (aplica migrations já geradas — **recomendado**)
- Start Command: `npm start`  (ou `npm run render-start` que aplica migrations e inicia)

Observação: confirme que `DATABASE_URL`, `JWT_SECRET`, `MP_ACCESS_TOKEN` e `NODE_ENV=production` estejam configuradas no ambiente da Render.

---

## Rotina de migrações (seguro)

Fluxo recomendado:
1. No dev local, com `DATABASE_URL` apontando pro DB dev:
```bash
npx prisma@6.16.2 migrate dev --name add-cores-variacao
npx prisma@6.16.2 generate
```
2. Teste localmente a API.
3. Commit a pasta `prisma/migrations` no repositório.
4. No ambiente de produção (Render), rode: `npx prisma@6.16.2 migrate deploy` (ou configure como Pre-Deploy Command)

Se precisar de um push rápido (dev only): `npx prisma@6.16.2 db push`.

---

## Como zerar/importar produtos em massa

- Para importar em massa, use o endpoint `/api/products/bulk` enviando um array de produtos (cada produto com `variacoes`). Exemplo de payload de 3 produtos foi enviado no repositório e no histórico de conversas.

- Para zerar a tabela de produtos (limpar tudo) com segurança:
  - Faça backup do DB.
  - Execute SQL (psql/pgAdmin):
```sql
BEGIN;
TRUNCATE TABLE "Produto" CASCADE;
COMMIT;
```
  - Ou via Prisma (cuidado): `await prisma.produto.deleteMany()` (em ambiente controlado).

---

## Dicas de manutenção e próximos passos

- Harden webhook: verificação de assinatura, idempotência, evitar dupla decrementação de estoque.
- Atualizar schema e migrar para Prisma 7 quando tiver tempo para adequar `prisma.config.ts` e `datasource` (benefícios: novos recursos e suporte atualizado).
- Implementar testes de integração para endpoints críticos (auth, checkout, webhook).
- Melhorar atualização de variações no `PUT /api/products/:id` — estratégia recomendada: diffs por `sku` ou operação de sincronização em transação (apagar/recriar com cautela).

---

## Contatos e referência
- Repositório: https://github.com/Capiweb/013Calcados-LojaWeb-backend
- Autor: equipe Capiweb

---

Se quiser, posso:
- Gerar as migrations localmente (se você autorizar execução de comandos aqui e tiver DATABASE_URL configurado),
- Implementar a sincronização completa de variações no update de produto,
- Adicionar checks/assinaturas no webhook e idempotência.

Fim da documentação detalhada.
