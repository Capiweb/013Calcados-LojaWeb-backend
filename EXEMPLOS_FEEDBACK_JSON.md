# 🧪 Exemplos JSON para Testes - Sistema de Avaliação

## 📌 Substitua estes valores com seus dados reais:
- `SEU_TOKEN_JWT` → Token obtido no login
- `PRODUTO_ID_AQUI` → ID do produto que você comprou

---

## ✅ Exemplo 1: Avaliação com 5 estrelas

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "PRODUTO_ID_AQUI",
  "estrelas": 5.0,
  "comentario": "Produto excelente! Superou minhas expectativas. Recomendo muito!"
}
```

**Status esperado:** 201 Created

---

## ⭐ Exemplo 2: Avaliação com 3.5 estrelas

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "PRODUTO_ID_AQUI",
  "estrelas": 3.5,
  "comentario": "Produto ok. A qualidade é boa, mas o preço está um pouco alto para a faixa."
}
```

**Status esperado:** 201 Created

---

## 👎 Exemplo 3: Avaliação baixa com 1.5 estrelas

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "PRODUTO_ID_AQUI",
  "estrelas": 1.5,
  "comentario": "Produto chegou com defeito e o atendimento foi lento"
}
```

**Status esperado:** 201 Created

---

## 💬 Exemplo 4: Avaliação sem comentário

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "PRODUTO_ID_AQUI",
  "estrelas": 4.0
}
```

**Status esperado:** 201 Created

---

## 🔍 Exemplo 5: Listar avaliações do produto

**Request:**
```
GET http://localhost:3000/api/feedback/product/PRODUTO_ID_AQUI
Content-Type: application/json
```

**Sem autenticação necessária!** ✨

**Com paginação:**
```
GET http://localhost:3000/api/feedback/product/PRODUTO_ID_AQUI?page=1&limit=5
```

**Status esperado:** 200 OK

---

## 📊 Exemplo 6: Ver estatísticas de avaliação

**Request:**
```
GET http://localhost:3000/api/feedback/product/PRODUTO_ID_AQUI/stats
Content-Type: application/json
```

**Status esperado:** 200 OK

**Exemplo de resposta:**
```json
{
  "media": 4.25,
  "total": 4,
  "distribution": {
    "1.5": 1,
    "3.5": 1,
    "4.0": 1,
    "5.0": 1
  }
}
```

---

## ❌ Exemplo 7: Erro - Avaliação inválida (valor quebrado incorreto)

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON) - ERRADO:**
```json
{
  "produtoId": "PRODUTO_ID_AQUI",
  "estrelas": 3.7,
  "comentario": "Valor inválido"
}
```

**Status esperado:** 400 Bad Request
**Erro:** "Avaliação deve ser em incrementos de 0.5"

---

## ❌ Exemplo 8: Erro - Usuário não comprou

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "PRODUTO_QUE_NAO_COMPROU",
  "estrelas": 4.0,
  "comentario": "Tentando avaliar sem comprar"
}
```

**Status esperado:** 403 Forbidden
**Erro:** "Você precisa ter comprado o produto para avaliá-lo"

---

## ❌ Exemplo 9: Erro - Avaliação duplicada

1. Crie uma avaliação (exemplo anterior)
2. Tente criar novamente com os mesmos dados:

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "MESMO_PRODUTO_JA_AVALIADO",
  "estrelas": 5.0,
  "comentario": "Tentativa de avaliação duplicada"
}
```

**Status esperado:** 409 Conflict
**Erro:** "Você já avaliou este produto"

---

## ❌ Exemplo 10: Erro - Produto não existe

**Request:**
```
POST http://localhost:3000/api/feedback
Authorization: Bearer SEU_TOKEN_JWT
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "produtoId": "00000000-0000-0000-0000-000000000000",
  "estrelas": 4.0,
  "comentario": "Produto fictício"
}
```

**Status esperado:** 404 Not Found
**Erro:** "Produto não encontrado"

---

## 📋 Checklist de Teste Completo

- [ ] Login e obter token
- [ ] Criar avaliação com 5 estrelas
- [ ] Criar avaliação com 3.5 estrelas
- [ ] Criar avaliação com 1.5 estrelas
- [ ] Criar avaliação sem comentário
- [ ] Listar avaliações do produto
- [ ] Ver estatísticas (media de 3.5 ou similar)
- [ ] Tentar criar avaliação inválida (3.7) - deve falhar
- [ ] Tentar avaliar produto que não comprou - deve falhar com 403
- [ ] Tentar avaliar novamente mesmo produto - deve falhar com 409
- [ ] Tentar produto inexistente - deve falhar com 404

---

## 🎯 Dica Importante

Se você não tiver comprado um produto real, você pode:

1. **Criar um pedido de teste** na tabela `Pedido` com status `PAGO`
2. **Criar um `PedidoItem`** associado ao produto
3. **Depois avaliar** esse produto

Ou pode usar o endpoint diretamente se tiver dados de teste no banco.

Boa sorte! 🚀⭐
