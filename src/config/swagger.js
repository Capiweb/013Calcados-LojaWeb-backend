import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - 013 Calçados',
      version: '1.0.0',
      description: 'Documentação da API de autenticação e gerenciamento de usuários',
      contact: {
        name: 'Support',
        url: 'https://github.com/Capiweb/013Calcados-LojaWeb-backend',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desenvolvimento',
      },
      {
        url: process.env.PRODUCTION_URL || 'https://api.exemplo.com',
        description: 'Servidor de produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header usando o esquema Bearer',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'Token JWT armazenado em cookie',
        },
      },
      schemas: {
        Usuario: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do usuário',
            },
            nome: {
              type: 'string',
              description: 'Nome completo do usuário',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
            },
            papel: {
              type: 'string',
              enum: ['USUARIO', 'ADMIN'],
              description: 'Papel do usuário no sistema',
            },
          },
          required: ['id', 'nome', 'email', 'papel'],
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            nome: {
              type: 'string',
              description: 'Nome completo do usuário',
              example: 'João Silva',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'joao@exemplo.com',
            },
            senha: {
              type: 'string',
              format: 'password',
              description: 'Senha (mínimo 6 caracteres)',
              example: 'senha123',
            },
            confirmarSenha: {
              type: 'string',
              format: 'password',
              description: 'Confirmação de senha',
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
              description: 'Token JWT para autenticação',
            },
            user: {
              type: 'object',
              properties: {
                nome: {
                  type: 'string',
                },
                email: {
                  type: 'string',
                },
                enderecos: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
