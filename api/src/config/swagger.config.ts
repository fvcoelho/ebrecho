import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eBrecho API',
      version,
      description: 'API for eBrecho - Second-hand fashion marketplace platform',
      contact: {
        name: 'eBrecho Support',
        email: 'support@ebrecho.com.br',
        url: 'https://ebrecho.com.br'
      },
      license: {
        name: 'Proprietary',
        url: 'https://ebrecho.com.br/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server'
      },
      {
        url: 'http://dev.ebrecho.com.br:3001',
        description: 'Development server'
      },
      {
        url: 'https://api.ebrecho.com.br',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT authentication token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              description: 'Total number of items'
            },
            page: {
              type: 'integer',
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              description: 'Items per page'
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            name: {
              type: 'string',
              description: 'User name'
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'CUSTOMER', 'PARTNER_ADMIN', 'PARTNER_USER', 'PROMOTER', 'SUPER_ADMIN'],
              description: 'User role'
            },
            isActive: {
              type: 'boolean',
              description: 'User account status'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            partnerId: {
              type: 'string',
              nullable: true,
              description: 'Associated partner ID'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            price: {
              type: 'number'
            },
            originalPrice: {
              type: 'number',
              nullable: true
            },
            category: {
              type: 'string'
            },
            subcategory: {
              type: 'string',
              nullable: true
            },
            condition: {
              type: 'string',
              enum: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR']
            },
            size: {
              type: 'string',
              nullable: true
            },
            color: {
              type: 'string',
              nullable: true
            },
            brand: {
              type: 'string',
              nullable: true
            },
            stock: {
              type: 'integer'
            },
            status: {
              type: 'string',
              enum: ['DRAFT', 'ACTIVE', 'SOLD', 'RESERVED', 'INACTIVE']
            },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string'
                  },
                  url: {
                    type: 'string'
                  },
                  isPrimary: {
                    type: 'boolean'
                  }
                }
              }
            },
            partnerId: {
              type: 'string'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Partner: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            slug: {
              type: 'string'
            },
            description: {
              type: 'string',
              nullable: true
            },
            logo: {
              type: 'string',
              nullable: true
            },
            banner: {
              type: 'string',
              nullable: true
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              nullable: true
            },
            website: {
              type: 'string',
              nullable: true
            },
            instagram: {
              type: 'string',
              nullable: true
            },
            isActive: {
              type: 'boolean'
            },
            settings: {
              type: 'object'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Product image ID'
            },
            productId: {
              type: 'string',
              description: 'Associated product ID'
            },
            originalUrl: {
              type: 'string',
              format: 'uri',
              description: 'Original image URL'
            },
            processedUrl: {
              type: 'string',
              format: 'uri',
              description: 'Processed image URL'
            },
            thumbnailUrl: {
              type: 'string',
              format: 'uri',
              description: 'Thumbnail image URL'
            },
            order: {
              type: 'integer',
              description: 'Display order'
            },
            metadata: {
              type: 'object',
              description: 'Image metadata (dimensions, size, etc.)',
              nullable: true
            },
            blobId: {
              type: 'string',
              description: 'Vercel Blob pathname for deletion',
              nullable: true
            },
            uploadMethod: {
              type: 'string',
              enum: ['local', 'blob'],
              description: 'Upload method used'
            },
            aiEnhanced: {
              type: 'boolean',
              description: 'Whether image has been AI enhanced'
            },
            enhancementProvider: {
              type: 'string',
              description: 'AI enhancement provider used',
              nullable: true
            },
            qualityScore: {
              type: 'number',
              description: 'AI quality score (0-1)',
              nullable: true
            },
            processingCost: {
              type: 'number',
              description: 'Processing cost in USD',
              nullable: true
            },
            enhancedUrl: {
              type: 'string',
              format: 'uri',
              description: 'AI enhanced image URL',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            orderNumber: {
              type: 'string'
            },
            customerId: {
              type: 'string'
            },
            partnerId: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
            },
            paymentMethod: {
              type: 'string',
              enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO']
            },
            paymentStatus: {
              type: 'string',
              enum: ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED']
            },
            subtotal: {
              type: 'number'
            },
            shippingCost: {
              type: 'number'
            },
            total: {
              type: 'number'
            },
            trackingNumber: {
              type: 'string',
              nullable: true
            },
            notes: {
              type: 'string',
              nullable: true
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string'
                  },
                  productId: {
                    type: 'string'
                  },
                  quantity: {
                    type: 'integer'
                  },
                  price: {
                    type: 'number'
                  },
                  total: {
                    type: 'number'
                  }
                }
              }
            },
            customer: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                }
              }
            },
            shippingAddress: {
              type: 'object',
              properties: {
                street: {
                  type: 'string'
                },
                number: {
                  type: 'string'
                },
                complement: {
                  type: 'string'
                },
                neighborhood: {
                  type: 'string'
                },
                city: {
                  type: 'string'
                },
                state: {
                  type: 'string'
                },
                zipCode: {
                  type: 'string'
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            name: {
              type: 'string'
            },
            phone: {
              type: 'string'
            },
            cpf: {
              type: 'string',
              nullable: true
            },
            birthDate: {
              type: 'string',
              format: 'date',
              nullable: true
            },
            partnerId: {
              type: 'string',
              nullable: true
            },
            isActive: {
              type: 'boolean'
            },
            addresses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string'
                  },
                  street: {
                    type: 'string'
                  },
                  number: {
                    type: 'string'
                  },
                  complement: {
                    type: 'string'
                  },
                  neighborhood: {
                    type: 'string'
                  },
                  city: {
                    type: 'string'
                  },
                  state: {
                    type: 'string'
                  },
                  zipCode: {
                    type: 'string'
                  },
                  isDefault: {
                    type: 'boolean'
                  }
                }
              }
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Authentication required'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Insufficient permissions'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Validation error',
                details: {
                  field: 'error message'
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Internal server error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Partners',
        description: 'Partner store management'
      },
      {
        name: 'Products',
        description: 'Product catalog management'
      },
      {
        name: 'Orders',
        description: 'Order processing'
      },
      {
        name: 'Customers',
        description: 'Customer management'
      },
      {
        name: 'Dashboard',
        description: 'Dashboard and analytics'
      },
      {
        name: 'Admin',
        description: 'Administrative functions'
      },
      {
        name: 'Public',
        description: 'Public endpoints (no auth required)'
      },
      {
        name: 'Public Store',
        description: 'Public store endpoints (no auth required)'
      },
      {
        name: 'Images',
        description: 'Image upload and processing'
      },
      {
        name: 'AI',
        description: 'AI-powered features'
      },
      {
        name: 'Promoter',
        description: 'Promoter system'
      },
      {
        name: 'System',
        description: 'System administration and testing endpoints'
      }
    ]
  },
  apis: process.env.VERCEL ? [
    // In Vercel, try both possible locations
    './src/routes/*.js',
    './src/routes/**/*.js', 
    './src/controllers/*.js',
    './src/controllers/**/*.js',
    './src/schemas/*.js',
    './dist/src/routes/*.js',
    './dist/src/routes/**/*.js',
    './dist/src/controllers/*.js',
    './dist/src/controllers/**/*.js',
    './dist/src/schemas/*.js'
  ] : [
    './src/routes/*.ts',
    './src/routes/**/*.ts',
    './src/controllers/*.ts',
    './src/controllers/**/*.ts',
    './src/schemas/*.ts'
  ]
};

// Generate swagger spec - handle both dev and production
let swaggerSpecGenerated;

if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
  // In production/Vercel: Load pre-generated swagger spec
  try {
    const fs = require('fs');
    const path = require('path');
    const preGeneratedPath = path.join(__dirname, '../../dist/swagger-spec.json');
    
    if (fs.existsSync(preGeneratedPath)) {
      console.log('📋 Loading pre-generated swagger spec from:', preGeneratedPath);
      swaggerSpecGenerated = JSON.parse(fs.readFileSync(preGeneratedPath, 'utf8'));
      console.log(`✅ Loaded ${Object.keys(swaggerSpecGenerated.paths || {}).length} documented endpoints`);
    } else {
      console.warn('⚠️  Pre-generated swagger spec not found, falling back to runtime generation');
      throw new Error('Pre-generated spec not found');
    }
  } catch (error) {
    console.warn('⚠️  Failed to load pre-generated spec, using runtime generation:', error.message);
    swaggerSpecGenerated = swaggerJsdoc(options);
  }
} else {
  // In development: Use runtime file scanning
  console.log('🔧 Development mode: scanning TypeScript files for @swagger documentation');
  swaggerSpecGenerated = swaggerJsdoc(options);
  const pathCount = Object.keys(swaggerSpecGenerated.paths || {}).length;
  console.log(`📋 Found ${pathCount} documented API endpoints in development`);
}

export const swaggerSpec = swaggerSpecGenerated;