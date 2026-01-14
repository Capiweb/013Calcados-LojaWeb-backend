# 📮 Guia Completo - Testando Carrinho no Postman

## 🚀 Passo 1: Configuração Inicial

### 1.1 Criar uma Collection
1. Abra o Postman
2. Clique em **"New"** → **"Collection"**
3. Nomeie como **"013 Calçados - Carrinho"**

### 1.2 Criar uma Environment
1. Clique em **"Environments"** (lado esquerdo)
2. Clique em **"Create"**
3. Nomeie como **"Local Dev"**
4. Adicione as variáveis:

```json
{
  "base_url": "http://localhost:3000",
  "token": "",
  "userId": "",
  "carrinhoId": "",
  "itemId": ""
}
```

---

## 📝 Passo 2: Requisições

### **1️⃣ Login (OBTER TOKEN)**

Primeiro você precisa fazer login para obter um token JWT.

**Tipo:** `POST`  
**URL:** `{{base_url}}/api/auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "seu.email@exemplo.com",
  "senha": "suaSenha123"
}
```

**Esperado (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-usuario",
    "nome": "João Silva",
    "email": "seu.email@exemplo.com",
    "papel": "USUARIO"
  }
}
```

**⚙️ Pós-requisição (Script na aba "Tests"):**
```javascript
// Salvar token automaticamente
if (pm.response.code === 200) {
  const data = pm.response.json();
  pm.environment.set("token", data.token);
  pm.environment.set("userId", data.user.id);
  console.log("✅ Token salvo:", data.token);
}
```

---

### **2️⃣ Obter Carrinho**

Retorna o carrinho completo com todos os itens.

**Tipo:** `GET`  
**URL:** `{{base_url}}/api/orders/cart`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** Deixe vazio

**Esperado (200):**
```json
{
  "id": "uuid-carrinho",
  "usuarioId": "uuid-usuario",
  "itens": [
    {
      "id": "uuid-item-1",
      "quantidade": 2,
      "carrinhoId": "uuid-carrinho",
      "produtoVariacaoId": "uuid-variacao-1",
      "produtoVariacao": {
        "id": "uuid-variacao-1",
        "tipoTamanho": "NUMERICO",
        "tamanho": "39",
        "estoque": 15,
        "sku": "SKU-001",
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
  "atualizadoEm": "2026-01-12T10:30:00Z"
}
```

**⚙️ Pós-requisição:**
```javascript
if (pm.response.code === 200) {
  const data = pm.response.json();
  pm.environment.set("carrinhoId", data.id);
  if (data.itens.length > 0) {
    pm.environment.set("itemId", data.itens[0].id);
  }
  console.log("✅ Carrinho obtido com sucesso");
}
```

---

### **3️⃣ Adicionar Item ao Carrinho**

Adiciona um novo produto ao carrinho.

**Tipo:** `POST`  
**URL:** `{{base_url}}/api/orders/cart`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoVariacaoId": "uuid-da-variacao",
  "quantidade": 1
}
```

> **ℹ️ Nota:** Substitua `uuid-da-variacao` com um UUID real de uma variação de produto que existe no seu banco

**Esperado (201):**
```json
{
  "id": "uuid-novo-item",
  "quantidade": 1,
  "carrinhoId": "uuid-carrinho",
  "produtoVariacaoId": "uuid-da-variacao",
  "criadoEm": "2026-01-12T10:45:00Z"
}
```

**⚙️ Pós-requisição:**
```javascript
if (pm.response.code === 201) {
  const data = pm.response.json();
  pm.environment.set("itemId", data.id);
  console.log("✅ Item adicionado ao carrinho");
}
```

---

### **4️⃣ Remover Item do Carrinho**

Remove um item específico do carrinho.

**Tipo:** `DELETE`  
**URL:** `{{base_url}}/api/orders/cart/items/{{itemId}}`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Body:** Deixe vazio

**Esperado (204):**
Sem corpo na resposta (apenas status)

**Validação:**
Se receber `204 No Content`, o item foi removido com sucesso.

---

### **5️⃣ Checkout (Finalizar Compra)**

Cria um pedido e gera um link de pagamento.

**Tipo:** `POST`  
**URL:** `{{base_url}}/api/orders/checkout`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Body (JSON):**
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

**Esperado (200):**
```json
{
  "init_point": "https://www.mercadopago.com.br/checkout/v1/...",
  "preference": {
    "id": "mercado-pago-preference-id",
    "items": [
      {
        "title": "Produto uuid-variacao",
        "quantity": 1,
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

---

## 🧪 Fluxo Completo de Testes

Siga a ordem abaixo para testar tudo:

```
┌─────────────────────────────────────────┐
│ 1. LOGIN - Obter Token                  │
│    POST /api/auth/login                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 2. GET CARRINHO - Visualizar vazio      │
│    GET /api/orders/cart                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 3. ADICIONAR ITEM 1                     │
│    POST /api/orders/cart                │
│    quantidade: 2                        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 4. ADICIONAR ITEM 2                     │
│    POST /api/orders/cart                │
│    quantidade: 1                        │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 5. GET CARRINHO - Ver 2 itens           │
│    GET /api/orders/cart                 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 6. REMOVER ITEM                         │
│    DELETE /api/orders/cart/items/{id}   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│ 7. CHECKOUT                             │
│    POST /api/orders/checkout            │
│    com dados de endereço                │
└─────────────────────────────────────────┘
```

---

## 🔑 Variáveis de Ambiente

Após fazer login, estas variáveis serão populadas automaticamente:

| Variável | Descrição |
|----------|-----------|
| `{{base_url}}` | URL da API (http://localhost:3000) |
| `{{token}}` | Token JWT obtido no login |
| `{{userId}}` | ID do usuário autenticado |
| `{{carrinhoId}}` | ID do carrinho |
| `{{itemId}}` | ID do último item adicionado |

---

## ⚠️ Tratamento de Erros

### Erro 401 - Não Autenticado
```json
{
  "error": "Token inválido ou expirado"
}
```
**Solução:** Faça login novamente

### Erro 400 - Dados Inválidos
```json
{
  "error": "produtoVariacaoId é obrigatório",
  "details": [...]
}
```
**Solução:** Verifique se o UUID é válido e se o produto existe

### Erro 404 - Não Encontrado
```json
{
  "error": "Item não encontrado"
}
```
**Solução:** Verifique se o ID está correto

### Erro 500 - Erro do Servidor
```json
{
  "error": "Erro ao adicionar item ao carrinho"
}
```
**Solução:** Verifique os logs do servidor

---

## 💡 Dicas Úteis

### 1. Salvar Respostas como Variáveis
Na aba **Tests** de qualquer requisição:
```javascript
// Exemplo: Salvar ID do item adicionado
const response = pm.response.json();
pm.environment.set("itemId", response.id);
```

### 2. Visualizar Variáveis
Clique em **Environment** no canto superior direito para ver todas as variáveis salvas.

### 3. Pre-request Scripts
Antes de rodar uma requisição, você pode adicionar validações:
```javascript
// Validar se token existe
const token = pm.environment.get("token");
if (!token) {
  pm.sendRequest("POST", pm.environment.get("base_url") + "/api/auth/login", {}, (err, res) => {
    // fazer login automaticamente
  });
}
```

### 4. Testar com Diferentes Dados
Para cada teste, mude os valores em **Body** para validar diferentes cenários:
- Quantidade negativa (deve falhar)
- Sem quantidade (deve falhar)
- UUID inválido (deve falhar)
- Endereço incompleto (deve falhar)

---

## 📊 Checklist de Testes

- [ ] Login retorna token
- [ ] Carrinho vazio está vazio
- [ ] Adicionar item retorna 201
- [ ] Carrinho mostra item adicionado
- [ ] Atualizar quantidade funciona
- [ ] Remover item retorna 204
- [ ] Carrinho atualiza após remover
- [ ] Checkout retorna link Mercado Pago
- [ ] Erro com endereço incompleto
- [ ] Erro sem autenticação

---

## 🎯 Próximos Passos

1. **Criar teste automatizado** com Postman Tests
2. **Executar em série** com Collection Runner
3. **Exportar resultados** como relatório
4. **Integrar com CI/CD** (GitHub Actions, etc)

---

## 📞 Precisa de Ajuda?

- Swagger UI: http://localhost:3000/api-docs
- Documentação: [CARRINHO_API.md](./CARRINHO_API.md)
- Console do Postman: View → Show Postman Console
