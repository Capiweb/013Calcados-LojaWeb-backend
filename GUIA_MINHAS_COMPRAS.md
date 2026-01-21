# 📦 Guia Completo - Minhas Compras (Meus Pedidos)

## 🎯 O que é "Minhas Compras"?

É a seção onde o usuário autenticado pode visualizar todos os seus pedidos (compras) realizadas na loja. Cada pedido contém:
- ✅ Informações do pedido (ID, status, total)
- ✅ Itens que foram comprados
- ✅ Endereço de entrega
- ✅ Status do pagamento
- ✅ Data de criação

---

## 🔗 Endpoint Principal

### **GET /api/orders**

Retorna todos os pedidos do usuário autenticado.

**URL:**
```
http://localhost:3000/api/orders
```

**Método:** `GET`

**Headers necessários:**
```json
{
  "Authorization": "Bearer {seu_token_jwt}",
  "Content-Type": "application/json"
}
```

---

## 📋 Resposta Esperada (200 OK)

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "usuarioId": "123e4567-e89b-12d3-a456-426614174000",
    "status": "PAGO",
    "total": 299.80,
    "rua": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Apto 101",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01311-100",
    "criadoEm": "2026-01-20T14:30:00Z",
    "atualizadoEm": "2026-01-20T14:35:00Z",
    "itens": [
      {
        "id": "item-uuid-1",
        "pedidoId": "550e8400-e29b-41d4-a716-446655440000",
        "produtoVariacaoId": "var-uuid-1",
        "quantidade": 1,
        "preco": 199.90,
        "produtoVariacao": {
          "id": "var-uuid-1",
          "sku": "NIKE-AIR-MAX-40",
          "tamanho": "40",
          "cores": ["Branco"],
          "produto": {
            "id": "prod-uuid-1",
            "nome": "Tênis Nike Air Max 90",
            "descricao": "Tênis esportivo confortável",
            "preco": "199.90",
            "imagemUrl": "https://example.com/img.jpg",
            "slug": "tenis-nike-air-max-90"
          }
        }
      },
      {
        "id": "item-uuid-2",
        "pedidoId": "550e8400-e29b-41d4-a716-446655440000",
        "produtoVariacaoId": "var-uuid-2",
        "quantidade": 1,
        "preco": 99.90,
        "produtoVariacao": {
          "id": "var-uuid-2",
          "sku": "MEIA-001",
          "produto": {
            "nome": "Meia Esportiva",
            "preco": "99.90"
          }
        }
      }
    ],
    "pagamento": [
      {
        "id": "pagamento-uuid",
        "pedidoId": "550e8400-e29b-41d4-a716-446655440000",
        "provedor": "mercado_pago",
        "pagamentoId": "1234567890",
        "status": "APROVADO",
        "criadoEm": "2026-01-20T14:32:00Z",
        "atualizadoEm": "2026-01-20T14:35:00Z"
      }
    ]
  }
]
```

---

## 📊 Status Possíveis de um Pedido

| Status | Descrição |
|--------|-----------|
| **PENDENTE** | Pedido criado, aguardando pagamento |
| **PAGO** | Pagamento aprovado |
| **CANCELADO** | Pedido foi cancelado |
| **ENVIADO** | Pedido foi despachado |
| **ENTREGUE** | Pedido foi entregue ao cliente |

---

## 💳 Status de Pagamento

| Status | Descrição |
|--------|-----------|
| **PENDENTE** | Aguardando confirmação do Mercado Pago |
| **APROVADO** | Pagamento confirmado ✅ |
| **REJEITADO** | Pagamento foi recusado ❌ |
| **REEMBOLSADO** | Reembolso realizado |

---

## 🚀 Passo a Passo para Testar

### **Passo 1: Fazer Login**
```bash
POST http://localhost:3000/api/auth/login
Body:
{
  "email": "usuario@email.com",
  "senha": "senha123"
}
```
📌 **Copie o token da resposta**

### **Passo 2: Adicionar Produtos ao Carrinho**
```bash
POST http://localhost:3000/api/orders/cart/items
Headers:
  Authorization: Bearer {token}
Body:
{
  "produtoVariacaoId": "uuid-valido",
  "quantidade": 1
}
```

### **Passo 3: Fazer Checkout**
```bash
POST http://localhost:3000/api/orders/checkout
Headers:
  Authorization: Bearer {token}
Body:
{
  "endereco": {
    "rua": "Rua Exemplo",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```
📌 **Você receberá um link do Mercado Pago para pagar**

### **Passo 4: Visualizar Minhas Compras**
```bash
GET http://localhost:3000/api/orders
Headers:
  Authorization: Bearer {token}
```
✅ **Verá todos os seus pedidos aqui!**

---

## 🧪 Teste no Postman (Cópia Rápida)

### **Obter Minhas Compras**

**Método:** `GET`

**URL:**
```
http://localhost:3000/api/orders
```

**Headers (JSON):**
```json
{
  "Authorization": "Bearer seu_token_aqui",
  "Content-Type": "application/json"
}
```

**Body:** Deixe vazio (GET não precisa de body)

**Resultado esperado:**
- Status: `200 OK`
- Retorna um array com todos os pedidos do usuário

---

## 📱 Estrutura do Pedido (JSON)

```json
{
  "id": "string (UUID)",
  "usuarioId": "string (UUID)",
  "status": "PENDENTE|PAGO|CANCELADO|ENVIADO|ENTREGUE",
  "total": "number (decimal)",
  "rua": "string",
  "numero": "string",
  "complemento": "string|null",
  "bairro": "string",
  "cidade": "string",
  "estado": "string",
  "cep": "string",
  "criadoEm": "ISO 8601 datetime",
  "atualizadoEm": "ISO 8601 datetime",
  "itens": [
    {
      "id": "string (UUID)",
      "pedidoId": "string (UUID)",
      "produtoVariacaoId": "string (UUID)",
      "quantidade": "number",
      "preco": "number (decimal)",
      "produtoVariacao": {
        "id": "string",
        "sku": "string",
        "tamanho": "string",
        "cores": ["string"],
        "produto": {
          "id": "string",
          "nome": "string",
          "descricao": "string",
          "preco": "number",
          "imagemUrl": "string",
          "slug": "string"
        }
      }
    }
  ],
  "pagamento": [
    {
      "id": "string (UUID)",
      "pedidoId": "string (UUID)",
      "provedor": "mercado_pago",
      "pagamentoId": "string",
      "status": "PENDENTE|APROVADO|REJEITADO|REEMBOLSADO",
      "criadoEm": "ISO 8601 datetime",
      "atualizadoEm": "ISO 8601 datetime"
    }
  ]
}
```

---

## ⚠️ Erros Comuns

| Erro | Cause | Solução |
|------|-------|--------|
| **401 Unauthorized** | Token ausente ou inválido | Fazer login primeiro e copiar o token |
| **403 Forbidden** | Acesso negado (requer autenticação) | Inclua o header `Authorization` |
| **500 Internal Server Error** | Erro no servidor | Verifique os logs do backend |
| **Nenhum pedido retornado** | Usuário não tem compras | É normal se é um usuário novo |

---

## 💡 Dicas Importantes

✅ **Você pode visualizar:**
- Todos os seus pedidos passados
- Status de cada pedido
- Itens que comprou em cada pedido
- Endereço de entrega
- Status do pagamento

❌ **Você NÃO pode:**
- Modificar pedidos já feitos
- Remover pedidos (exceto cancelar)
- Ver pedidos de outros usuários

🔒 **Segurança:**
- Cada usuário só vê seus próprios pedidos
- Token JWT valida a identidade
- O servidor filtra por `usuarioId`

---

## 📌 Endpoints Relacionados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| **GET** | `/api/orders` | Listar meus pedidos ✨ |
| **GET** | `/api/orders/cart` | Ver carrinho atual |
| **POST** | `/api/orders/cart/items` | Adicionar item ao carrinho |
| **DELETE** | `/api/orders/cart/items/{id}` | Remover item do carrinho |
| **POST** | `/api/orders/checkout` | Criar pedido e gerar link Mercado Pago |
| **GET** | `/api/orders/admin` | Listar todos pedidos (admin) |

---

## 🎬 Fluxo Completo de Compra

```
1. Usuário faz LOGIN
   ↓
2. Navega pela LOJA (vê produtos)
   ↓
3. Adiciona itens ao CARRINHO
   ↓
4. Faz CHECKOUT (insere endereço)
   ↓
5. Recebe LINK DO MERCADO PAGO
   ↓
6. Realiza PAGAMENTO
   ↓
7. Vê seu pedido em "MINHAS COMPRAS"
   ↓
8. Status do pedido muda (PAGO → ENVIADO → ENTREGUE)
```

---

**Última atualização:** 21 de janeiro de 2026
