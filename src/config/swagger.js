import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - 013 Calçados',
      version: '1.0.0',
      description: 'Documentação completa da API de e-commerce da 013 Calçados',
      termsOfService: 'http://swagger.io/terms/',
      contact: {
        name: 'Suporte da API',
        url: 'https://github.com/Capiweb/013Calcados-LojaWeb-backend',
        email: 'suporte@013calcados.com.br',
      },
      license: {
        name: 'Apache 2.0',
        url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desenvolvimento',
        variables: {
          protocol: {
            enum: ['http', 'https'],
            default: 'http',
          },
        },
      },
      {
        url: process.env.PRODUCTION_URL || 'https://api.exemplo.com',
        description: 'Servidor de produção',
      },
    ],
    tags: [
      {
        name: 'Autenticação',
        description: 'Endpoints de autenticação e verificação de token',
      },
      {
        name: 'Usuários',
        description: 'Gerenciamento de usuários e perfis',
      },
      {
        name: 'Produtos',
        description: 'Catálogo de produto',
      },
      {
        name: 'Categorias',
        description: 'Categorias de produtos',
      },
      {
        name: 'Pedidos',
        description: 'Carrinho e pedidos',
      },
      {
        name: 'Webhooks',
        description: 'Webhooks de pagamento',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header usando o esquema Bearer token',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Token JWT armazenado em cookie',
        },
      },
      schemas: {
        /* ========== SCHEMAS DE USUÁRIO ========== */
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do usuário',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário',
              example: 'João Silva Santos',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'joao@exemplo.com',
            },
            papel: {
              type: 'string',
              enum: ['USUARIO', 'ADMIN'],
              description: 'Papel do usuário no sistema',
              example: 'USUARIO',
            },
            criadoEm: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora de criação',
            },
            atualizadoEm: {
              type: 'string',
              format: 'date-time',
              description: 'Data e hora da última atualização',
            },
          },
          required: ['id', 'nome', 'email', 'papel'],
        },
        UsuarioFullProfile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string' },
            email: { type: 'string', format: 'email' },
            papel: { type: 'string', enum: ['USUARIO', 'ADMIN'] },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
            enderecos: {
              type: 'array',
              items: { $ref: '#/components/schemas/Endereco' },
            },
            pedidos: {
              type: 'array',
              items: { $ref: '#/components/schemas/Pedido' },
            },
            carrinho: { $ref: '#/components/schemas/Carrinho' },
          },
        },
        Endereco: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            rua: { type: 'string', example: 'Rua das Flores' },
            numero: { type: 'string', example: '123' },
            complemento: { type: 'string', example: 'Apto 45' },
            bairro: { type: 'string', example: 'Centro' },
            cidade: { type: 'string', example: 'São Paulo' },
            estado: { type: 'string', example: 'SP' },
            cep: { type: 'string', example: '01310-100' },
            criadoEm: { type: 'string', format: 'date-time' },
          },
          required: ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'],
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome completo do usuário',
              example: 'João Silva',
              minLength: 3,
            },
            documento: {
              type: 'string',
              description: 'Documento do usuário',
              example: '1234567890',
              minLength: 11,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email único do usuário',
              example: 'joao@exemplo.com',
            },
            senha: {
              type: 'string',
              format: 'password',
              description: 'Senha (mínimo 6 caracteres)',
              example: 'senha123',
              minLength: 6,
            },
            confirmarSenha: {
              type: 'string',
              format: 'password',
              description: 'Confirmação de senha (deve ser igual à senha)',
              example: 'senha123',
            },
          },
          required: ['nome', 'email', 'senha', 'confirmarSenha'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'joao@exemplo.com',
            },
            senha: {
              type: 'string',
              format: 'password',
              description: 'Senha do usuário',
              example: 'senha123',
            },
          },
          required: ['email', 'senha'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token JWT para autenticação em requisições futuras',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                nome: { type: 'string' },
                email: { type: 'string', format: 'email' },
                papel: { type: 'string', enum: ['USUARIO', 'ADMIN'] },
                enderecos: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Endereco' },
                },
              },
            },
          },
        },
        CheckAuthResponse: {
          type: 'object',
          properties: {
            authenticated: { type: 'boolean' },
            user: { $ref: '#/components/schemas/Usuario' },
          },
        },
        IsAdminResponse: {
          type: 'object',
          properties: {
            isAdmin: { type: 'boolean' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                nome: { type: 'string' },
                papel: { type: 'string', enum: ['USUARIO', 'ADMIN'] },
              },
            },
          },
        },

        /* ========== SCHEMAS DE PRODUTO E CATEGORIA ========== */
        Categoria: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string', example: 'Tênis' },
            slug: { type: 'string', example: 'tenis', description: 'Slug único da categoria' },
            criadoEm: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'nome', 'slug'],
        },
        CategoryCreate: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome da categoria',
              example: 'Tênis',
            },
            slug: {
              type: 'string',
              description: 'Slug único da categoria (sem espaços, minúsculas)',
              example: 'tenis',
            },
          },
          required: ['nome', 'slug'],
        },
        ProdutoVariacao: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            estrelas: { type: 'number', description: 'Média de avaliações para esta variação (opcional)', example: 0 },
            tipoTamanho: { type: 'string', enum: ['NUMERICO', 'LETRA'], description: 'Tipo de tamanho' },
            tamanho: { type: 'string', example: '39', description: 'Valor do tamanho' },
            estoque: { type: 'integer', example: 15, description: 'Quantidade em estoque' },
            sku: { type: 'string', example: 'SKU-123456', description: 'SKU único do produto' },
            criadoEm: { type: 'string', format: 'date-time' },
          },
          required: ['tipoTamanho', 'tamanho', 'estoque', 'sku'],
        },
        Produto: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            estrelas: { type: 'number', description: 'Média de avaliações do produto (0.5 - 5.5)', example: 4.5 },
            nome: { type: 'string', example: 'Tênis Air Max' },
            descricao: { type: 'string', example: 'Tênis esportivo premium' },
            preco: { type: 'number', format: 'decimal', example: 299.99 },
            emPromocao: { type: 'boolean', example: false },
            precoPromocional: { type: 'number', format: 'decimal', nullable: true, example: 199.99 },
            slug: { type: 'string', example: 'tenis-air-max' },
            imagemUrl: { type: 'string', format: 'url' },
            categoriaId: { type: 'string', format: 'uuid' },
            categoria: { $ref: '#/components/schemas/Categoria' },
            variacoes: {
              type: 'array',
              items: { $ref: '#/components/schemas/ProdutoVariacao' },
            },
            feedbacks: {
              type: 'array',
              description: 'Lista de avaliações do produto (mais recentes primeiro)',
              items: { $ref: '#/components/schemas/Feedback' }
            },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
          },
          required: ['id', 'nome', 'descricao', 'preco', 'slug', 'imagemUrl', 'categoriaId'],
        },
        ProductCreate: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome do produto',
              example: 'Tênis Air Max',
            },
            descricao: {
              type: 'string',
              description: 'Descrição detalhada do produto',
              example: 'Tênis esportivo de alta performance',
            },
            preco: {
              type: 'number',
              format: 'decimal',
              description: 'Preço original',
              example: 299.99,
            },
            emPromocao: {
              type: 'boolean',
              description: 'Se produto está em promoção',
              example: false,
            },
            precoPromocional: {
              type: 'number',
              format: 'decimal',
              nullable: true,
              description: 'Preço promocional (opcional)',
              example: 199.99,
            },
            slug: {
              type: 'string',
              description: 'Slug único do produto',
              example: 'tenis-air-max',
            },
            imagemUrl: {
              type: 'string',
              format: 'url',
              description: 'URL da imagem do produto',
            },
            categoriaId: {
              type: 'string',
              format: 'uuid',
              description: 'ID da categoria',
            },
            variacoes: {
              type: 'array',
              description: 'Variações do produto (tamanhos)',
              items: {
                type: 'object',
                properties: {
                  tipoTamanho: { type: 'string', enum: ['NUMERICO', 'LETRA'] },
                  tamanho: { type: 'string' },
                  estoque: { type: 'integer' },
                  sku: { type: 'string' },
                  cores: { type: 'array', items: { type: 'string' }, description: 'Array de cores disponíveis para a variação' },
                },
                required: ['tipoTamanho', 'tamanho', 'estoque', 'sku'],
              },
            },
          },
          required: ['nome', 'descricao', 'preco', 'slug', 'imagemUrl', 'categoriaId', 'variacoes'],
        },

        /* ========== SCHEMAS DE PEDIDO E CARRINHO ========== */
        CarrinhoItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quantidade: { type: 'integer', example: 2 },
            produtoVariacao: { $ref: '#/components/schemas/ProdutoVariacao' },
            criadoEm: { type: 'string', format: 'date-time' },
          },
        },
        Carrinho: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            usuarioId: { type: 'string', format: 'uuid' },
            itens: {
              type: 'array',
              items: { $ref: '#/components/schemas/CarrinhoItem' },
            },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
          },
        },
        PedidoItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            quantidade: { type: 'integer' },
            preco: { type: 'number', format: 'decimal' },
            produtoVariacao: { $ref: '#/components/schemas/ProdutoVariacao' },
          },
        },
        Pagamento: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            pedidoId: { type: 'string', format: 'uuid' },
            provedor: { type: 'string', example: 'mercado_pago' },
            pagamentoId: { type: 'string', description: 'ID do pagamento no provedor' },
            status: {
              type: 'string',
              enum: ['PENDENTE', 'APROVADO', 'REJEITADO', 'REEMBOLSADO'],
              example: 'PENDENTE',
            },
            criadoEm: { type: 'string', format: 'date-time' },
          },
        },
        Pedido: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            usuarioId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['PENDENTE', 'PAGO', 'CANCELADO', 'ENVIADO', 'ENTREGUE'],
              example: 'PENDENTE',
            },
            total: { type: 'number', format: 'decimal' },
            rua: { type: 'string' },
            numero: { type: 'string' },
            complemento: { type: 'string', nullable: true },
            bairro: { type: 'string' },
            cidade: { type: 'string' },
            estado: { type: 'string' },
            cep: { type: 'string' },
            itens: {
              type: 'array',
              items: { $ref: '#/components/schemas/PedidoItem' },
            },
            pagamento: { $ref: '#/components/schemas/Pagamento' },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' },
          },
        },
        AddToCartRequest: {
          type: 'object',
          properties: {
            produtoVariacaoId: {
              type: 'string',
              format: 'uuid',
              description: 'ID da variação do produto',
            },
            quantidade: {
              type: 'integer',
              description: 'Quantidade a adicionar',
              example: 1,
            },
          },
          required: ['produtoVariacaoId', 'quantidade'],
          example: {
            produtoVariacaoId: '03f55e29-8ad8-4ce0-b5ec-c8133f2324cd',
            quantidade: 1
          }
        },
        CheckoutRequest: {
          type: 'object',
          properties: {
            endereco: {
              type: 'object',
              description: 'Endereço de entrega',
              properties: {
                rua: { type: 'string' },
                numero: { type: 'string' },
                complemento: { type: 'string' },
                bairro: { type: 'string' },
                cidade: { type: 'string' },
                estado: { type: 'string' },
                cep: { type: 'string' },
              },
              // endereco can be partial; controller will merge with saved address
              required: ['rua', 'numero', 'bairro', 'cidade', 'estado', 'cep'],
            },
          },
          // Not strictly required: if omitted, server will use saved address
          required: [],
          example: {
            endereco: {
              rua: 'Av. Teste',
              numero: '10',
              complemento: 'Apto 1',
              bairro: 'Centro',
              cidade: 'São Paulo',
              estado: 'SP',
              cep: '01234-000'
            }
          }
        },
        CheckoutResponse: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              format: 'url',
              description: 'URL para checkout no Mercado Pago (init_point)'
            },
            preference: {
              type: 'object',
              description: 'Objeto completo retornado pelo Mercado Pago ao criar a preferência'
            }
          },
          example: {
            url: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=1234567890',
            preference: { id: '1234567890', init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=1234567890' }
          }
        },

        /* ========== SCHEMAS DE ERRO ========== */
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
              example: 'Email já cadastrado',
            },
            message: {
              type: 'string',
              description: 'Detalhes adicionais do erro',
            },
            code: {
              type: 'string',
              description: 'Código de erro',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            preference_url: { type: 'string' },
            preference_id: { type: 'string' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            nome: { type: 'string' },
            descricao: { type: 'string' },
            preco: { type: 'number' },
            emPromocao: { type: 'boolean' },
            precoPromocional: { type: 'number' },
            slug: { type: 'string' },
            imagemUrl: { type: 'string' },
            categoria: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                nome: { type: 'string' },
                slug: { type: 'string' }
              }
            },
            variacoes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  tipoTamanho: { type: 'string' },
                  tamanho: { type: 'string' },
                  estoque: { type: 'integer' },
                  sku: { type: 'string' },
                  cores: { type: 'array', items: { type: 'string' } },
                  criadoEm: { type: 'string', format: 'date-time' }
                }
              }
            },
            criadoEm: { type: 'string', format: 'date-time' },
            atualizadoEm: { type: 'string', format: 'date-time' }
          }
        },
        ProductListResponse: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
            produtos: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Product'
              }
            }
          }
        },
        Feedback: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            usuarioId: { type: 'string', format: 'uuid' },
            produtoId: { type: 'string', format: 'uuid' },
            estrelas: { type: 'number', example: 4.5 },
            comentario: { type: 'string' },
            criadoEm: { type: 'string', format: 'date-time' }
          }
        },
        ProductDetailResponse: {
          $ref: '#/components/schemas/Product'
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
