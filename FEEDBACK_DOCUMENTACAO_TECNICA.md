# 📊 Documentação Técnica - Sistema de Avaliação de Produtos

## 📖 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Schema do Banco de Dados](#schema-do-banco-de-dados)
4. [Endpoints](#endpoints)
5. [Fluxos de Negócio](#fluxos-de-negócio)
6. [Validações](#validações)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Performance](#performance)

---

## 🎯 Visão Geral

O sistema de avaliação permite que usuários que compraram um produto avaliem-o com:
- **Estrelas**: valores quebrados de 0.5 em 0.5 (0.5 a 5.5)
- **Comentários**: texto opcional até 1000 caracteres

A **média de avaliações é atualizada automaticamente** no produto e armazenada em um campo `estrelas`.

**Principais características:**
- ✅ Protegido por autenticação JWT
- ✅ Verificação de compra obrigatória
- ✅ Evita avaliações duplicadas (constraint única)
- ✅ Transações ACID para garantir integridade
- ✅ Paginação para listagem de feedbacks
- ✅ Estatísticas de distribuição de estrelas

---

## 🏗️ Arquitetura

### Padrão MVC Adaptado

```
Request HTTP
    ↓
[Middleware de Autenticação] → Valida JWT
    ↓
[Middleware de Validação] → Valida payload com Zod
    ↓
[Controller] → Extrai dados da request
    ↓
[Service] → Implementa lógica de negócio
    ↓
[Repository] → Acessa banco de dados
    ↓
[Prisma ORM] → Executa queries
    ↓
Response HTTP
```

### Organização de Arquivos

```
src/
├── controllers/
│   └── feedback.controller.js       # Handlers dos endpoints
├── service/
│   └── feedback.service.js          # Lógica de negócio
├── repositories/
│   └── feedback.repository.js       # Acesso ao banco
├── validators/
│   └── feedback.validator.js        # Schemas Zod
├── routes/
│   └── feedback.routes.js           # Definição de rotas + Swagger
└── middleware/
    ├── authMiddleware.js            # Autenticação JWT
    └── validateMiddleware.js        # Validação com Zod
```

---

## 🗄️ Schema do Banco de Dados

### Modelo Feedback

```prisma
model Feedback {
  id              String   @id @default(uuid())
  
  usuarioId       String
  usuario         Usuario  @relation(fields: [usuarioId], references: [id])
  
  produtoId       String
  produto         Produto  @relation(fields: [produtoId], references: [id])
  
  estrelas        Float    // Avaliação em estrelas
  comentario      String?  // Texto opcional
  
  criadoEm        DateTime @default(now())
  atualizadoEm    DateTime @updatedAt

  // Constraint única: evita avaliações duplicadas
  @@unique([usuarioId, produtoId])
}
```

### Relacionamentos

```
Usuario (1) ──→ (N) Feedback
Produto (1) ──→ (N) Feedback
```

### Campo Adicionado ao Produto

```prisma
model Produto {
  // ... outros campos
  estrelas Float @default(0)  // Média das avaliações
  feedbacks Feedback[]        // Relacionamento
}
```

---

## 🔌 Endpoints

### 1. POST /api/feedback - Criar Avaliação

**Autenticação:** Obrigatória (Bearer Token)

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Body:**
```json
{
  "produtoId": "550e8400-e29b-41d4-a716-446655440000",
  "estrelas": 4.5,
  "comentario": "Produto excelente!"
}
```

**Resposta 201 Created:**
```json
{
  "message": "Avaliação criada com sucesso",
  "feedback": {
    "id": "760e8400-e29b-41d4-a716-446655440001",
    "usuarioId": "550e8400-e29b-41d4-a716-446655440002",
    "produtoId": "550e8400-e29b-41d4-a716-446655440000",
    "estrelas": 4.5,
    "comentario": "Produto excelente!",
    "criadoEm": "2026-01-14T10:30:00Z",
    "atualizadoEm": "2026-01-14T10:30:00Z",
    "usuario": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "nome": "João Silva"
    }
  }
}
```

---

### 2. GET /api/feedback/product/{produtoId} - Listar Avaliações

**Autenticação:** Opcional

**Query Parameters:**
```
page=1&limit=10
```

**Resposta 200 OK:**
```json
{
  "feedbacks": [
    {
      "id": "760e8400-e29b-41d4-a716-446655440001",
      "usuarioId": "550e8400-e29b-41d4-a716-446655440002",
      "produtoId": "550e8400-e29b-41d4-a716-446655440000",
      "estrelas": 5.0,
      "comentario": "Excelente!",
      "criadoEm": "2026-01-14T10:30:00Z",
      "atualizadoEm": "2026-01-14T10:30:00Z",
      "usuario": {
        "id": "550e8400-e29b-41d4-a716-446655440002",
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

---

### 3. GET /api/feedback/product/{produtoId}/stats - Estatísticas

**Autenticação:** Opcional

**Resposta 200 OK:**
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

---

## 🔄 Fluxos de Negócio

### Criar Avaliação (Fluxo Completo)

```
1. Receber requisição POST /api/feedback
   ↓
2. Autenticação (authMiddleware)
   - Extrair e validar JWT
   - Settar req.user.id
   ↓
3. Validação (validateMiddleware + Zod)
   - Validar produtoId é UUID
   - Validar estrelas entre 0.5 e 5.5
   - Validar incrementos de 0.5
   - Validar comentário <= 1000 caracteres
   ↓
4. Controller → Service
   - Extrair usuarioId de req.user
   - Extrair payload do body
   ↓
5. Service: createFeedback()
   a) Verificar se produto existe
      - Se não → 404 Not Found
   
   b) Verificar se usuário já avaliou
      - Buscar feedback com (usuarioId, produtoId)
      - Se existe → 409 Conflict
   
   c) Verificar se usuário comprou o produto
      - Buscar PedidoItem com condições:
        * Pedido.usuarioId = usuarioId
        * Pedido.status IN ['PAGO', 'ENVIADO', 'ENTREGUE']
        * ProdutoVariacao.produtoId = produtoId
      - Se não encontra → 403 Forbidden
   
   d) TRANSAÇÃO (Prisma)
      - Criar Feedback
      - Calcular NOVA média
      - Atualizar Produto.estrelas
      - Commit ou Rollback
   
   e) Retornar feedback criado
   ↓
6. Controller → Cliente
   - Status 201 Created
   - Body com feedback completo
```

### Calcular Média de Avaliações

```
1. Agregação no banco (Prisma aggregate)
   ```
   SELECT AVG(estrelas) 
   FROM Feedback 
   WHERE produtoId = ?
   ```

2. Resultado:
   - Se há feedbacks → média (Float com precisão)
   - Se não há → 0

3. Arredondar? NÃO!
   - A média pode ser 4.666... (3 avaliações: 4.5, 5.0, 4.5)
   - Armazenar como está no banco (Float)
   - Frontend pode arredondar para exibir
```

---

## ✅ Validações

### Validator Schema (Zod)

```typescript
export const CreateFeedbackSchema = z.object({
  produtoId: z.string().uuid('ID do produto deve ser um UUID válido'),
  estrelas: z
    .number()
    .min(0.5, 'Avaliação mínima é 0.5 estrelas')
    .max(5.5, 'Avaliação máxima é 5.5 estrelas')
    .refine(
      (value) => (value * 2) % 1 === 0,
      {
        message: 'Avaliação deve ser em incrementos de 0.5',
      }
    ),
  comentario: z
    .string()
    .max(1000, 'Comentário não pode exceder 1000 caracteres')
    .optional()
    .nullable(),
})
```

### Validações no Service

| Validação | Fase | Erro | Status |
|-----------|------|------|--------|
| Produto existe | Service | "Produto não encontrado" | 404 |
| Não é avaliação duplicada | Service | "Você já avaliou este produto" | 409 |
| Usuário comprou | Service | "Você precisa ter comprado o produto" | 403 |
| Estrelas em incrementos 0.5 | Zod | "Avaliação deve ser em incrementos de 0.5" | 400 |
| Estrelas no range | Zod | "Avaliação entre 0.5 e 5.5" | 400 |
| Comentário <= 1000 chars | Zod | "Comentário muito longo" | 400 |
| produtoId é UUID | Zod | "UUID inválido" | 400 |
| Autenticado | Middleware | "Token não fornecido" | 401 |

---

## ❌ Tratamento de Erros

### Erros e Status Codes

| Status | Erro | Quando |
|--------|------|--------|
| **400** | Bad Request | Dados inválidos (estrelas, comentário, etc) |
| **401** | Unauthorized | Sem token ou token inválido |
| **403** | Forbidden | Usuário não comprou o produto |
| **404** | Not Found | Produto não existe |
| **409** | Conflict | Usuário já avaliou esse produto |
| **500** | Internal Server | Erro inesperado no servidor |

### Exemplo de Resposta de Erro

```json
{
  "error": "Você já avaliou este produto"
}
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Fluxo Completo com SQL Setup

```bash
# 1. Criar categoria
POST /api/categories
{
  "nome": "Tênis",
  "slug": "tenis"
}

# 2. Criar produto
POST /api/products/bulk
[
  {
    "nome": "Tênis Running",
    "descricao": "Tênis para corrida",
    "preco": 299.90,
    "slug": "tenis-running",
    "imagemUrl": "https://...",
    "categoriaId": "uuid-categoria",
    "variacoes": [...]
  }
]

# 3. Registrar usuário (se novo)
POST /api/auth/register
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123"
}

# 4. Login
POST /api/auth/login
{
  "email": "joao@example.com",
  "senha": "senha123"
}
// Copiar token da resposta

# 5. Criar pedido/compra
POST /api/orders/cart/items
{
  "produtoVariacaoId": "uuid-variacao",
  "quantidade": 1
}

POST /api/orders/checkout
{
  "endereco": {
    "rua": "Rua Principal",
    "numero": "100",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567"
  }
}

# 6. Marcar pedido como pago (via Mercado Pago ou SQL)
UPDATE "Pedido" SET status = 'PAGO' WHERE id = 'uuid-pedido'

# 7. Criar avaliação
POST /api/feedback
Authorization: Bearer {token}
{
  "produtoId": "uuid-produto",
  "estrelas": 4.5,
  "comentario": "Excelente produto!"
}

# 8. Listar avaliações
GET /api/feedback/product/uuid-produto

# 9. Ver estatísticas
GET /api/feedback/product/uuid-produto/stats
```

### Exemplo 2: Teste de Erro (409 - Duplicata)

```bash
# Primeira avaliação (sucesso)
POST /api/feedback
{
  "produtoId": "uuid-produto",
  "estrelas": 5.0,
  "comentario": "Ótimo!"
}
// Status: 201

# Segunda avaliação do MESMO usuário para o MESMO produto
POST /api/feedback
{
  "produtoId": "uuid-produto",
  "estrelas": 4.0,
  "comentario": "Revendo minha nota"
}
// Status: 409
// Response: { "error": "Você já avaliou este produto" }
```

### Exemplo 3: Teste de Erro (403 - Não comprou)

```bash
POST /api/feedback
{
  "produtoId": "uuid-produto-que-nao-comprou",
  "estrelas": 3.0,
  "comentario": "Tentativa de avaliação"
}
// Status: 403
// Response: { "error": "Você precisa ter comprado o produto para avaliá-lo" }
```

---

## ⚡ Performance

### Índices no Banco

O constraint único `@@unique([usuarioId, produtoId])` cria automaticamente um índice composto, acelerando:
- Verificação de duplicatas
- Busca de feedback de um usuário em um produto

```sql
-- Índice criado automaticamente
CREATE UNIQUE INDEX "Feedback_usuarioId_produtoId_key" 
ON "Feedback" ("usuarioId", "produtoId");
```

### Queries Otimizadas

1. **Verificar duplicata:**
   ```sql
   SELECT id FROM Feedback 
   WHERE usuarioId = ? AND produtoId = ?
   LIMIT 1
   ```

2. **Verificar compra:**
   ```sql
   SELECT pi.id FROM "PedidoItem" pi
   JOIN "Pedido" p ON pi."pedidoId" = p.id
   JOIN "ProdutoVariacao" pv ON pi."produtoVariacaoId" = pv.id
   WHERE p."usuarioId" = ? 
   AND pv."produtoId" = ?
   AND p.status IN ('PAGO', 'ENVIADO', 'ENTREGUE')
   LIMIT 1
   ```

3. **Calcular média:**
   ```sql
   SELECT AVG(estrelas) FROM Feedback WHERE produtoId = ?
   ```

4. **Listar com paginação:**
   ```sql
   SELECT * FROM Feedback 
   WHERE produtoId = ?
   ORDER BY "criadoEm" DESC
   LIMIT ? OFFSET ?
   ```

### N+1 Query Prevention

O Repository usa `include` para carregar relacionamentos em uma única query:

```javascript
// ✅ BOM: Uma query
feedback = await prisma.feedback.findUnique({
  where: { id },
  include: {
    usuario: { select: { id, nome } },
    produto: { select: { id, nome } }
  }
})

// ❌ RUIM: 3 queries (N+1)
feedback = await prisma.feedback.findUnique({ where: { id } })
usuario = await prisma.usuario.findUnique({ where: { id: feedback.usuarioId } })
produto = await prisma.produto.findUnique({ where: { id: feedback.produtoId } })
```

---

## 📚 Referências

- Prisma Docs: https://www.prisma.io/docs/
- Express.js: https://expressjs.com/
- Zod Validation: https://zod.dev/
- JWT Auth: https://jwt.io/

---

**Documentação v1.0** | Janeiro 2026
