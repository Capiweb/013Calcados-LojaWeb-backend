# Guia de Testes - Meus Pedidos

## 📋 Endpoints para Testar

### 1️⃣ **Listar Meus Pedidos** (GET)
```
GET http://localhost:3000/api/orders
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

**Resposta esperada (200):**
```json
[
  {
    "id": "uuid-do-pedido",
    "usuarioId": "uuid-usuario",
    "status": "PENDENTE",
    "total": 150.50,
    "endereco": {
      "rua": "Rua Exemplo",
      "numero": "123",
      "cidade": "São Paulo",
      "estado": "SP"
    },
    "itens": [
      {
        "id": "item-id",
        "quantidade": 2,
        "preco": 75.25,
        "produtoVariacao": {
          "id": "var-id",
          "sku": "PROD-001-P",
          "produto": {
            "nome": "Tênis Esporte",
            "descricao": "Tênis confortável"
          }
        }
      }
    ],
    "pagamento": {
      "provedor": "mercado_pago",
      "status": "PENDENTE"
    },
    "criadoEm": "2026-01-21T10:30:00Z",
    "atualizadoEm": "2026-01-21T10:30:00Z"
  }
]
```

---

### 2️⃣ **Obter Carrinho** (GET)
```
GET http://localhost:3000/api/orders/cart
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

**Resposta esperada (200):**
```json
{
  "id": "uuid-carrinho",
  "usuarioId": "uuid-usuario",
  "itens": [
    {
      "id": "item-id",
      "quantidade": 1,
      "preco": 150.50,
      "produtoVariacao": {
        "id": "var-id",
        "sku": "PROD-001-M",
        "produto": {
          "nome": "Sapato",
          "imagemUrl": "https://..."
        }
      }
    }
  ],
  "total": 150.50
}
```

---

### 3️⃣ **Adicionar Item ao Carrinho** (POST)
```
POST http://localhost:3000/api/orders/cart/items
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "produtoVariacaoId": "uuid-da-variacao",
  "quantidade": 2
}
```

**Resposta esperada (201):**
```json
{
  "id": "item-uuid",
  "carrinhoId": "carrinho-uuid",
  "produtoVariacaoId": "variacao-uuid",
  "quantidade": 2,
  "preco": 89.90
}
```

---

### 4️⃣ **Remover Item do Carrinho** (DELETE)
```
DELETE http://localhost:3000/api/orders/cart/items/{id}
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

**Resposta esperada (204):**
```
No Content (vazio)
```

---

### 5️⃣ **Criar Pedido e Checkout** (POST)
```
POST http://localhost:3000/api/orders/checkout
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "endereco": {
    "rua": "Avenida Principal",
    "numero": "500",
    "complemento": "Apto 101",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```

**Resposta esperada (200):**
```json
{
  "url": "https://www.mercadopago.com.br/checkout/v1/...",
  "preference": {
    "id": "mp-preference-id",
    "init_point": "https://www.mercadopago.com.br/checkout/v1/...",
    "items": [
      {
        "id": "PROD-001-M",
        "title": "Tênis Esporte",
        "quantity": 1,
        "unit_price": 150.50,
        "currency_id": "BRL"
      }
    ]
  }
}
```

---

### 6️⃣ **Listar Todos os Pedidos** (Admin) (GET)
```
GET http://localhost:3000/api/orders/admin?status=PENDENTE&userId={userId}
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_admin}",
  "Content-Type": "application/json"
}
```

**Query Parameters:**
- `status`: PENDENTE, PAGO, CANCELADO, ENVIADO, ENTREGUE (opcional)
- `userId`: UUID do usuário (opcional)

**Resposta esperada (200):**
```json
[
  {
    "id": "uuid-pedido",
    "usuarioId": "uuid-usuario",
    "status": "PAGO",
    "total": 250.75,
    "usuario": {
      "nome": "João Silva",
      "email": "joao@email.com"
    }
  }
]
```

---

### 7️⃣ **Listar Todos os Carrinhos** (Admin) (GET)
```
GET http://localhost:3000/api/orders/carts
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_admin}",
  "Content-Type": "application/json"
}
```

**Resposta esperada (200):**
```json
[
  {
    "id": "uuid-carrinho",
    "usuarioId": "uuid-usuario",
    "itens": [...],
    "total": 150.50
  }
]
```

---

### 8️⃣ **Obter Carrinho Específico** (Admin) (GET)
```
GET http://localhost:3000/api/orders/carts/{id}
```

**Headers:**
```json
{
  "Authorization": "Bearer {seu_token_admin}",
  "Content-Type": "application/json"
}
```

**Resposta esperada (200):**
```json
{
  "id": "uuid-carrinho",
  "usuarioId": "uuid-usuario",
  "itens": [
    {
      "id": "item-id",
      "quantidade": 1,
      "preco": 150.50
    }
  ]
}
```

---

## 🔍 Passo a Passo para Testar

### **1. Autenticação**
```bash
# Fazer login e obter token JWT
POST http://localhost:3000/api/auth/login
Body: { "email": "usuario@email.com", "senha": "senha123" }
# Copiar o token da resposta
```

### **2. Listar Carrinho Atual**
```bash
# Com o token obtido
GET http://localhost:3000/api/orders/cart
Header: Authorization: Bearer {token}
```

### **3. Adicionar Produtos ao Carrinho**
```bash
# Primeiro, obter uma variação de produto válida
GET http://localhost:3000/api/products
# Copiar um ID de ProdutoVariacao
```

```bash
# Depois adicionar ao carrinho
POST http://localhost:3000/api/orders/cart/items
Header: Authorization: Bearer {token}
Body: { "produtoVariacaoId": "xxx", "quantidade": 2 }
```

### **4. Visualizar Carrinho Atualizado**
```bash
GET http://localhost:3000/api/orders/cart
Header: Authorization: Bearer {token}
```

### **5. Fazer Checkout**
```bash
POST http://localhost:3000/api/orders/checkout
Header: Authorization: Bearer {token}
Body: { "endereco": {...} }
# Você receberá um link do Mercado Pago
```

### **6. Listar Meus Pedidos**
```bash
GET http://localhost:3000/api/orders
Header: Authorization: Bearer {token}
```

---

## ⚠️ Possíveis Erros

| Erro | Causa | Solução |
|------|-------|--------|
| **401 Unauthorized** | Token JWT inválido ou ausente | Fazer login e copiar o token |
| **400 Bad Request** | Dados do body inválidos | Verificar o formato do JSON |
| **404 Not Found** | ID do produto não existe | Usar IDs válidos de produtos |
| **500 Internal Server Error** | Erro no servidor | Verificar logs do servidor |
| **CarrinhoVazio** | Carrinho sem itens no checkout | Adicionar itens antes de fazer checkout |

---

## 🛠️ Variáveis Úteis (Postman)

Adicione estas variáveis no Postman para facilitar:

```json
{
  "baseUrl": "http://localhost:3000/api",
  "token": "seu_token_jwt_aqui",
  "userId": "seu_uuid_usuario",
  "produtoVariacaoId": "uuid_da_variacao"
}
```

Depois use nas URLs: `{{baseUrl}}/orders`

---

## 📊 Checklist de Testes

- [ ] Login e obtenção do token
- [ ] Listar carrinho vazio
- [ ] Adicionar item ao carrinho
- [ ] Listar carrinho com item
- [ ] Atualizar quantidade de item
- [ ] Remover item do carrinho
- [ ] Listar carrinho vazio novamente
- [ ] Adicionar múltiplos itens
- [ ] Fazer checkout com sucesso
- [ ] Listar meus pedidos
- [ ] (Admin) Listar todos os pedidos
- [ ] (Admin) Listar todos os carrinhos
- [ ] (Admin) Obter carrinho específico

---

**Última atualização:** 21 de janeiro de 2026
