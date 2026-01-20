# ⚡ Referência Rápida - Backend 013 Calçados

## 🚀 Iniciar o Servidor

```bash
npm install
npm run dev
```

Acesso: `http://localhost:3000`
Swagger: `http://localhost:3000/api-docs`

---

## 🔐 Autenticação

### Registrar
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123"
}
```

### Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Usar Token
```bash
Authorization: Bearer {seu_token_aqui}
```

---

## 🏪 Categorias

### Criar
```bash
POST /api/categories
Authorization: Bearer {token}

{
  "nome": "Tênis",
  "slug": "tenis"
}
```

### Listar
```bash
GET /api/categories
```

---

## 👟 Produtos

### Criar (único)
```bash
POST /api/products
Authorization: Bearer {token} (ADMIN)

{
  "nome": "Tênis Running",
  "descricao": "Para corrida",
  "preco": 299.90,
  "slug": "tenis-running",
  "imagemUrl": "https://...",
  "categoriaId": "uuid-categoria",
  "variacoes": [
    {
      "tipoTamanho": "NUMERICO",
      "tamanho": "40",
      "estoque": 10,
      "sku": "TR-40-001",
      "cores": ["preto", "branco"]
    }
  ]
}
```

### Listar com Filtros
```bash
GET /api/products?page=1&limit=10&categoria=tenis&precoMin=200&precoMax=500
```

### Obter Um
```bash
GET /api/products/{id}
```

---

## 🛒 Carrinho & Pedidos

### Ver Carrinho
```bash
GET /api/orders/cart
Authorization: Bearer {token}
```

### Adicionar Item
```bash
POST /api/orders/cart/items
Authorization: Bearer {token}

{
  "produtoVariacaoId": "uuid-variacao",
  "quantidade": 1
}
```

### Checkout
```bash
POST /api/orders/checkout
Authorization: Bearer {token}

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
```

---

## ⭐ Avaliações

### Criar Avaliação
```bash
POST /api/feedback
Authorization: Bearer {token}

{
  "produtoId": "uuid-produto",
  "estrelas": 4.5,
  "comentario": "Excelente produto!"
}
```

**Valores válidos de estrelas:**
- 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5

### Listar Avaliações
```bash
GET /api/feedback/product/{produtoId}?page=1&limit=10
```

### Ver Estatísticas
```bash
GET /api/feedback/product/{produtoId}/stats
```

---

## 🔑 Valores de Teste

### Produto ID (exemplo)
```
550e8400-e29b-41d4-a716-446655440000
```

### Variação ID (exemplo)
```
550e8400-e29b-41d4-a716-446655440001
```

### Categoria ID (exemplo)
```
1d3a264f-ee88-4615-b33c-2f8f0eaef019
```

---

## 📊 Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| **200** | OK |
| **201** | Criado |
| **204** | Sem conteúdo |
| **400** | Requisição inválida |
| **401** | Não autenticado |
| **403** | Não autorizado (não comprou, etc) |
| **404** | Não encontrado |
| **409** | Conflito (avaliação duplicada) |
| **500** | Erro no servidor |

---

## 🗄️ Estrutura de Pastas

```
src/
├── controllers/      # Lógica de request/response
├── service/          # Lógica de negócio
├── repositories/     # Acesso ao banco
├── routes/           # Definição de rotas
├── validators/       # Schemas Zod
├── middleware/       # Middlewares
└── utils/            # Utilitários

prisma/
├── schema.prisma     # Definição do banco
└── migrations/       # Histórico de mudanças
```

---

## 🔍 Verificação Rápida do Sistema

### 1. Banco Conectado?
```bash
npx prisma studio
# Deve abrir interface visual do banco
```

### 2. Variáveis de Ambiente?
```bash
cat .env
# Verificar DATABASE_URL e JWT_SECRET
```

### 3. Servidor Rodando?
```bash
curl http://localhost:3000/api-docs
# Deve retornar página Swagger
```

### 4. Criar Dados de Teste?
```bash
# Via Postman ou curl, siga o fluxo de teste
# (ver seção Fluxo de Teste)
```

---

## 💾 Comandos Prisma

```bash
# Gerar client
npx prisma generate

# Criar migration
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrations
npx prisma migrate deploy

# Reset banco (⚠️ deleta dados)
npx prisma migrate reset

# Ver status
npx prisma migrate status

# Abrir studio (UI visual)
npx prisma studio
```

---

## 🐛 Troubleshooting

### Erro: "Column does not exist"
```bash
# Aplicar migrations
npx prisma migrate dev
# ou
npx prisma migrate deploy
```

### Erro: "Cannot POST /api/feedback"
- Verifique se a rota está registrada em `index.js`
- Verifique o método (POST vs GET)
- Verifique o caminho exato

### Erro: "Token inválido"
- Faça login novamente
- Copie o token completo
- Use no header: `Authorization: Bearer {token}`

### Erro: 403 "Não comprou o produto"
- Crie um pedido primeiro
- Marque como PAGO
- Espere alguns segundos antes de avaliar

### Erro: 409 "Já avaliou este produto"
- Você já criou uma avaliação
- Tente com outro produto ou outro usuário

---

## 📚 Arquivos de Documentação

| Arquivo | Conteúdo |
|---------|----------|
| **README.md** | Guia geral |
| **FEEDBACK_DOCUMENTACAO_TECNICA.md** | Detalhes técnicos |
| **FEEDBACK_POSTMAN.md** | Testes no Postman |
| **EXEMPLOS_FEEDBACK_JSON.md** | Exemplos prontos |
| **PROJETO_SUMARIO_EXECUTIVO.md** | Visão geral |
| **REFERENCIA_RAPIDA.md** | Este arquivo |

---

## 🌐 URLs Importantes

| URL | Descrição |
|-----|-----------|
| `http://localhost:3000` | API base |
| `http://localhost:3000/api-docs` | Documentação Swagger |
| `http://localhost:3000/api-docs.json` | OpenAPI JSON |

---

## 💡 Dicas

1. **Sempre use tokens:** POST, PUT, DELETE exigem autenticação
2. **UUIDs válidos:** Use formato `550e8400-e29b-41d4-a716-446655440000`
3. **Paginação padrão:** page=1, limit=10
4. **Estrelas com 2 casas decimais:** 4.5 não 4.50
5. **JSON válido:** Use aspas duplas, não simples
6. **Teste públicos primeiro:** GET sem auth são mais fáceis

---

## 🎓 Fluxo Completo de Teste (5 min)

```
1. Login
   POST /api/auth/login

2. Ver produtos
   GET /api/products

3. Adicionar ao carrinho
   POST /api/orders/cart/items

4. Checkout
   POST /api/orders/checkout

5. (Admin) Marcar como pago
   SQL: UPDATE "Pedido" SET status='PAGO'

6. Criar avaliação
   POST /api/feedback

7. Ver avaliações
   GET /api/feedback/product/{id}

8. Ver stats
   GET /api/feedback/product/{id}/stats
```

---

**Última atualização:** 14 de Janeiro de 2026
**Versão:** 1.0
