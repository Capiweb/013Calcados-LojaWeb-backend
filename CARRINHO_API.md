# 🛒 API de Carrinho de Compras

## Overview

O sistema de carrinho permite que clientes autenticados adicionem, visualizem e removam produtos de seu carrinho de compras. O carrinho é criado automaticamente quando o usuário faz seu primeiro acesso.

---

## 📋 Endpoints

### 1. **Obter Carrinho do Usuário**

Retorna o carrinho completo do usuário autenticado com todos os itens.

```http
GET /api/orders/cart
```

**Headers (Obrigatório):**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Response (200 - OK):**
```json
{
  "id": "uuid-carrinho",
  "usuarioId": "uuid-usuario",
  "itens": [
    {
      "id": "uuid-item",
      "quantidade": 2,
      "carrinhoId": "uuid-carrinho",
      "produtoVariacaoId": "uuid-variacao",
      "produtoVariacao": {
        "id": "uuid-variacao",
        "tipoTamanho": "NUMERICO",
        "tamanho": "39",
        "estoque": 15,
        "sku": "SKU-123",
        "produto": {
          "id": "uuid-produto",
          "nome": "Tênis Air Max",
          "preco": 299.99,
          "imagemUrl": "https://..."
        }
      },
      "criadoEm": "2026-01-12T10:00:00Z"
    }
  ],
  "criadoEm": "2026-01-12T09:00:00Z",
  "atualizadoEm": "2026-01-12T10:00:00Z"
}
```

**Erros:**
- `401` - Não autenticado
- `500` - Erro do servidor

---

### 2. **Adicionar Item ao Carrinho**

Adiciona um produto (variação) ao carrinho ou atualiza a quantidade se já existe.

```http
POST /api/orders/cart
```

**Headers (Obrigatório):**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "produtoVariacaoId": "uuid-variacao",
  "quantidade": 2
}
```

**Response (201 - Created):**
```json
{
  "id": "uuid-item",
  "quantidade": 2,
  "carrinhoId": "uuid-carrinho",
  "produtoVariacaoId": "uuid-variacao",
  "criadoEm": "2026-01-12T10:30:00Z"
}
```

**Erros:**
- `400` - Produto não encontrado ou dados inválidos
- `401` - Não autenticado
- `500` - Erro do servidor

**Validações:**
- `produtoVariacaoId` é obrigatório e deve ser um UUID válido
- `quantidade` é obrigatória e deve ser um número inteiro > 0
- A variação deve existir no banco de dados

---

### 3. **Remover Item do Carrinho**

Remove um item específico do carrinho do usuário.

```http
DELETE /api/orders/cart/items/{id}
```

**Headers (Obrigatório):**
```json
{
  "Authorization": "Bearer {token}"
}
```

**Path Parameters:**
- `id` (string, uuid) - ID do item do carrinho

**Response (204 - No Content):**
Sem corpo na resposta

**Erros:**
- `401` - Não autenticado
- `404` - Item não encontrado
- `500` - Erro do servidor

---

### 4. **Finalizar Compra (Checkout)**

Cria um pedido a partir do carrinho e gera um link de pagamento no Mercado Pago.

```http
POST /api/orders/checkout
```

**Headers (Obrigatório):**
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "endereco": {
    "rua": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```

**Response (200 - OK):**
```json
{
  "init_point": "https://www.mercadopago.com.br/checkout/v1/...",
  "preference": {
    "id": "mercado-pago-preference-id",
    "items": [
      {
        "title": "Produto uuid-variacao",
        "quantity": 2,
        "unit_price": 299.99,
        "currency_id": "BRL"
      }
    ],
    "back_urls": {
      "success": "https://...",
      "failure": "https://...",
      "pending": "https://..."
    }
  }
}
```

**Erros:**
- `400` - Carrinho vazio ou dados de endereço inválidos
- `401` - Não autenticado
- `500` - Erro ao processar pagamento

**Validações:**
- Carrinho deve conter pelo menos 1 item
- Todos os campos de endereço são obrigatórios
- CEP deve ser válido

---

## 🔄 Fluxo de Compra Completo

```
1. Usuário faz login
   └─> Recebe token JWT

2. Adiciona produtos ao carrinho
   └─> POST /api/orders/cart
   └─> POST /api/orders/cart (múltiplas vezes)

3. Visualiza carrinho
   └─> GET /api/orders/cart

4. Remove itens indesejados (opcional)
   └─> DELETE /api/orders/cart/items/{id}

5. Finaliza a compra
   └─> POST /api/orders/checkout
   └─> Recebe link de pagamento

6. Cliente é redirecionado para Mercado Pago
   └─> Completa o pagamento

7. Webhook notifica a API
   └─> Pedido é atualizado com status
```

---

## 📊 Dados do Carrinho

### Estrutura de um Item do Carrinho

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do item |
| `carrinhoId` | UUID | ID do carrinho pai |
| `produtoVariacaoId` | UUID | ID da variação do produto |
| `quantidade` | Int | Quantidade adicionada |
| `criadoEm` | DateTime | Data de criação |

### Estrutura do Carrinho

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do carrinho |
| `usuarioId` | UUID | ID do usuário proprietário |
| `itens` | Array | Array de items do carrinho |
| `criadoEm` | DateTime | Data de criação |
| `atualizadoEm` | DateTime | Última atualização |

---

## ⚙️ Regras de Negócio

1. **Um Carrinho por Usuário**: Cada usuário possui apenas um carrinho
2. **Criação Automática**: O carrinho é criado automaticamente no primeiro acesso
3. **Atualização de Quantidade**: Se um item já existe, a quantidade é atualizada (não somada)
4. **Carrinho Persistente**: O carrinho persiste entre sessões
5. **Limpeza após Checkout**: O carrinho é limpo após um checkout bem-sucedido
6. **Validação de Estoque**: O sistema valida se há estoque na variação

---

## 🛡️ Autenticação

Todos os endpoints requerem autenticação via Bearer Token JWT.

**Como obter o token:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "usuario@exemplo.com"
  }
}
```

---

## 📝 Exemplos de Uso

### JavaScript/Fetch

```javascript
const token = localStorage.getItem('token');

// Adicionar ao carrinho
async function addToCart(produtoVariacaoId, quantidade) {
  const response = await fetch('http://localhost:3000/api/orders/cart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      produtoVariacaoId,
      quantidade
    })
  });
  return await response.json();
}

// Obter carrinho
async function getCart() {
  const response = await fetch('http://localhost:3000/api/orders/cart', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Remover do carrinho
async function removeFromCart(itemId) {
  await fetch(`http://localhost:3000/api/orders/cart/items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

// Finalizar compra
async function checkout(endereco) {
  const response = await fetch('http://localhost:3000/api/orders/checkout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ endereco })
  });
  const data = await response.json();
  // Redirecionar para Mercado Pago
  window.location.href = data.init_point;
}
```

### cURL

```bash
# Adicionar ao carrinho
curl -X POST http://localhost:3000/api/orders/cart \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "produtoVariacaoId": "uuid-variacao",
    "quantidade": 1
  }'

# Obter carrinho
curl -X GET http://localhost:3000/api/orders/cart \
  -H "Authorization: Bearer {token}"

# Remover item
curl -X DELETE http://localhost:3000/api/orders/cart/items/uuid-item \
  -H "Authorization: Bearer {token}"

# Checkout
curl -X POST http://localhost:3000/api/orders/checkout \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "endereco": {
      "rua": "Rua das Flores",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01310-100"
    }
  }'
```

---

## 🔗 Links Úteis

- [Documentação Swagger](http://localhost:3000/api-docs)
- [API de Produtos](/PRODUTOS_API.md)
- [API de Autenticação](/AUTH_API.md)
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers)

---

## 📞 Suporte

Para dúvidas ou problemas, consulte a documentação interativa em:
`http://localhost:3000/api-docs`
