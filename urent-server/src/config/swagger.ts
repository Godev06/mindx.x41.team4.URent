import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'URent API',
      version: '1.0.0',
      description: 'REST API cho ứng dụng URent — cho thuê & mượn đồ dùng'
    },
    servers: [
      { url: 'http://localhost:5003', description: 'Local dev' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {

        // ─── Shared ───────────────────────────────────────────────────────────

        /** Dùng chung cho mọi response đơn giản chỉ trả message */
        SimpleMessage: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Operation successful' }
          }
        },

        /** Metadata phân trang cursor-based (dùng bởi product & message routes) */
        PaginationMeta: {
          type: 'object',
          nullable: true,
          properties: {
            limit:      { type: 'integer', example: 20 },
            hasMore:    { type: 'boolean', example: false },
            nextCursor: { type: 'string', nullable: true, example: null }
          }
        },

        // ─── Auth ─────────────────────────────────────────────────────────────

        RegisterBody: {
          oneOf: [
            {
              title: 'Email / Password',
              type: 'object',
              required: ['email', 'password', 'username'],
              properties: {
                email:       { type: 'string', format: 'email', example: 'user@example.com' },
                password:    { type: 'string', minLength: 6, example: 'secret123' },
                username:    { type: 'string', minLength: 3, maxLength: 30, example: 'john_doe' },
                displayName: { type: 'string', minLength: 1, maxLength: 100, example: 'John Doe' }
              }
            },
            {
              title: 'Google (Firebase ID token)',
              type: 'object',
              required: ['idToken'],
              properties: {
                idToken: { type: 'string', description: 'Firebase ID token từ Google Sign-In' }
              }
            }
          ]
        },

        LoginBody: {
          oneOf: [
            {
              title: 'Email + Password',
              type: 'object',
              required: ['password'],
              properties: {
                email:    { type: 'string', format: 'email', example: 'user@example.com', description: 'Bắt buộc nếu không dùng phone' },
                password: { type: 'string', minLength: 6, example: 'secret123' }
              }
            },
            {
              title: 'Phone + Password',
              type: 'object',
              required: ['phone', 'password'],
              properties: {
                phone:    { type: 'string', minLength: 7, maxLength: 20, example: '0912345678', description: 'Số điện thoại đã xác minh' },
                password: { type: 'string', minLength: 6, example: 'secret123' }
              }
            },
            {
              title: 'Google (Firebase ID token)',
              type: 'object',
              required: ['idToken'],
              properties: {
                idToken: { type: 'string', description: 'Firebase ID token từ Google Sign-In' }
              }
            }
          ]
        },

        /** Body dùng chung cho register/verify-otp và login/verify-otp */
        OtpBody: {
          type: 'object',
          required: ['email', 'otp'],
          properties: {
            email: { type: 'string', format: 'email' },
            otp:   { type: 'string', minLength: 6, maxLength: 6, example: '123456' }
          }
        },

        /** Body cho POST /verify-otp (unified endpoint) */
        VerifyOtpBody: {
          allOf: [
            { $ref: '#/components/schemas/OtpBody' },
            {
              type: 'object',
              required: ['purpose'],
              properties: {
                purpose: {
                  type: 'string',
                  enum: ['register', 'login', 'reset password'],
                  example: 'register'
                }
              }
            }
          ]
        },

        ForgotPasswordBody: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' }
          }
        },

        ResetPasswordBody: {
          type: 'object',
          required: ['email', 'newPassword'],
          properties: {
            email:       { type: 'string', format: 'email' },
            otp:         { type: 'string', minLength: 6, maxLength: 6, description: 'OTP reset mật khẩu' },
            token:       { type: 'string', description: 'Alias cho otp' },
            newPassword: { type: 'string', minLength: 6 }
          }
        },

        /** Response khi đăng nhập / đăng nhập Google thành công */
        TokenResponse: {
          type: 'object',
          properties: {
            token:   { type: 'string' },
            message: { type: 'string' }
          }
        },

        // ─── User / Profile ───────────────────────────────────────────────────

        /** Document User trả về từ GET /me, GET/PATCH /profile (không có các trường nhạy cảm) */
        User: {
          type: 'object',
          properties: {
            _id:             { type: 'string', example: '664abc123def456789012345' },
            email:           { type: 'string', format: 'email' },
            username:        { type: 'string', nullable: true },
            displayName:     { type: 'string', nullable: true },
            bio:             { type: 'string', maxLength: 200, nullable: true },
            avatarUrl:       { type: 'string', nullable: true },
            phone:           { type: 'string', nullable: true },
            isEmailVerified: { type: 'boolean' },
            createdAt:       { type: 'string', format: 'date-time' },
            updatedAt:       { type: 'string', format: 'date-time' }
          }
        },

        UpdateProfileBody: {
          type: 'object',
          properties: {
            displayName:     { type: 'string', minLength: 1, maxLength: 100 },
            bio:             { type: 'string', maxLength: 200 },
            phone:           { type: 'string', minLength: 7, maxLength: 20 },
            currentPassword: { type: 'string', minLength: 6 },
            newPassword:     { type: 'string', minLength: 6 }
          }
        },

        // ─── Settings ─────────────────────────────────────────────────────────

        Settings: {
          type: 'object',
          properties: {
            _id:                  { type: 'string' },
            userId:               { type: 'string' },
            theme:                { type: 'string', enum: ['light', 'dark'] },
            language:             { type: 'string', enum: ['vi', 'en'] },
            emailNotifications:   { type: 'boolean' },
            screenNotifications:  { type: 'boolean' },
            twoFactorEnabled:     { type: 'boolean' },
            createdAt:            { type: 'string', format: 'date-time' },
            updatedAt:            { type: 'string', format: 'date-time' }
          }
        },

        UpdateSettingsBody: {
          type: 'object',
          required: ['twoFactorEnabled'],
          properties: {
            twoFactorEnabled: { type: 'boolean' }
          }
        },

        // ─── Products ─────────────────────────────────────────────────────────

        ProductOwner: {
          type: 'object',
          properties: {
            userId: { type: 'string', nullable: true },
            name:   { type: 'string' },
            avatar: { type: 'string' },
            rating: { type: 'number', minimum: 0, maximum: 5 },
            trips:  { type: 'integer', minimum: 0 }
          }
        },

        Product: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string' },
            category:    { type: 'string' },
            price:       { type: 'number', minimum: 0 },
            status:      { type: 'string', enum: ['Available', 'Active', 'Completed'] },
            quantity:    { type: 'integer', minimum: 0 },
            stockStatus: { type: 'string', enum: ['In Stock', 'Low Stock', 'Out of Stock'] },
            image:       { type: 'string' },
            imageUrl:    { type: 'string', nullable: true },
            rating:      { type: 'number', minimum: 0, maximum: 5, nullable: true },
            reviews:     { type: 'integer', minimum: 0, nullable: true },
            description: { type: 'string', nullable: true },
            specs:       { type: 'array', items: { type: 'string' }, nullable: true },
            owner:       { $ref: '#/components/schemas/ProductOwner', nullable: true },
            lastUpdated: { type: 'string', format: 'date-time' },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' }
          }
        },

        /** Response của GET /api/v1/products — bọc bởi sendSuccess */
        ProductListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'array', items: { $ref: '#/components/schemas/Product' } },
            meta:    { $ref: '#/components/schemas/PaginationMeta' }
          }
        },

        // ─── Messages / Conversations ─────────────────────────────────────────

        Conversation: {
          type: 'object',
          properties: {
            _id:              { type: 'string' },
            conversationType: { type: 'string', enum: ['ONE_TO_ONE'] },
            pairKey:          { type: 'string', nullable: true },
            lastMessage:      { type: 'string', nullable: true },
            lastMessageAt:    { type: 'string', format: 'date-time', nullable: true },
            createdAt:        { type: 'string', format: 'date-time' },
            updatedAt:        { type: 'string', format: 'date-time' }
          }
        },

        MessageProductMetadata: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string', description: 'MongoDB ObjectId của sản phẩm' },
            snapshot: {
              type: 'object',
              description: 'Snapshot thông tin sản phẩm tại thời điểm gửi',
              properties: {
                name:        { type: 'string' },
                pricePerDay: { type: 'number' },
                imageUrl:    { type: 'string' },
                category:    { type: 'string' }
              }
            }
          }
        },

        MessageLocationMetadata: {
          type: 'object',
          required: ['latitude', 'longitude'],
          properties: {
            latitude:  { type: 'number', minimum: -90,  maximum: 90  },
            longitude: { type: 'number', minimum: -180, maximum: 180 },
            address:   { type: 'string', nullable: true }
          }
        },

        Message: {
          type: 'object',
          properties: {
            _id:            { type: 'string' },
            conversationId: { type: 'string' },
            senderId:       { type: 'string' },
            messageType:    { type: 'string', enum: ['TEXT', 'PRODUCT', 'LOCATION'] },
            content:        { type: 'string', maxLength: 2000, nullable: true },
            metadata: {
              nullable: true,
              oneOf: [
                { $ref: '#/components/schemas/MessageProductMetadata' },
                { $ref: '#/components/schemas/MessageLocationMetadata' }
              ]
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },

        SendMessageBody: {
          type: 'object',
          required: ['messageType'],
          properties: {
            messageType: {
              type: 'string',
              enum: ['TEXT', 'PRODUCT', 'LOCATION'],
              example: 'TEXT'
            },
            content: {
              type: 'string', maxLength: 2000,
              description: 'Bắt buộc khi `messageType = TEXT`',
              example: 'Xin chào!'
            },
            metadata: {
              description: 'Bắt buộc khi `messageType = PRODUCT` (cần `productId`) hoặc `LOCATION` (cần `latitude`, `longitude`)',
              oneOf: [
                { $ref: '#/components/schemas/MessageProductMetadata' },
                { $ref: '#/components/schemas/MessageLocationMetadata' }
              ]
            }
          }
        },

        CreateConversationBody: {
          type: 'object',
          required: ['peerUserId'],
          properties: {
            peerUserId: { type: 'string', description: 'MongoDB ObjectId của user đối phương' }
          }
        },

        /** Response bọc bởi sendSuccess cho một conversation */
        ConversationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { $ref: '#/components/schemas/Conversation' },
            meta:    { nullable: true, example: null }
          }
        },

        /** Response bọc bởi sendSuccess cho danh sách conversations */
        ConversationListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'array', items: { $ref: '#/components/schemas/Conversation' } },
            meta:    { $ref: '#/components/schemas/PaginationMeta' }
          }
        },

        /** Response bọc bởi sendSuccess cho danh sách messages */
        MessageListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'array', items: { $ref: '#/components/schemas/Message' } },
            meta:    { $ref: '#/components/schemas/PaginationMeta' }
          }
        },

        /** Response bọc bởi sendSuccess cho một message */
        MessageItemResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { $ref: '#/components/schemas/Message' },
            meta:    { nullable: true, example: null }
          }
        },

        // ─── Notifications ─────────────────────────────────────────────────────

        /** Notification model */
        Notification: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '507f1f77bcf86cd799439011' },
            userId:      { type: 'string', example: '507f1f77bcf86cd799439011' },
            title:       { type: 'string', example: 'Đơn hàng mới' },
            description: { type: 'string', example: 'Bạn có đơn hàng mới từ Nguyễn Văn A' },
            type:        { type: 'string', enum: ['order', 'message', 'promotion', 'system'], example: 'order' },
            time:        { type: 'string', example: '2 giờ trước' },
            read:        { type: 'boolean', example: false },
            readAt:      { type: 'string', format: 'date-time', nullable: true },
            activityLogId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            eventKey:    { type: 'string', example: 'evt_507f1f77bcf86cd799439011' },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' }
          }
        },

        /** Response bọc bởi sendSuccess cho danh sách notifications */
        NotificationListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
            meta:    {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page:       { type: 'integer', example: 1 },
                    limit:      { type: 'integer', example: 10 },
                    total:      { type: 'integer', example: 25 },
                    totalPages: { type: 'integer', example: 3 },
                    hasNext:    { type: 'boolean', example: true },
                    hasPrev:    { type: 'boolean', example: false }
                  }
                }
              }
            }
          }
        },

        /** Response bọc bởi sendSuccess cho một notification */
        NotificationResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { $ref: '#/components/schemas/Notification' },
            meta:    { nullable: true, example: null }
          }
        },

        // ─── Orders ──────────────────────────────────────────────────────────

        /** Order model */
        Order: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '507f1f77bcf86cd799439011' },
            orderCode:   { type: 'string', example: 'ORD-1234567890-ABCDE' },
            productId:   { type: 'string', example: '507f1f77bcf86cd799439011' },
            productName: { type: 'string', example: 'Máy ảnh Canon EOS R5' },
            customerId:  { type: 'string', example: '507f1f77bcf86cd799439011' },
            customerName: { type: 'string', example: 'Nguyễn Văn A' },
            startDate:   { type: 'string', format: 'date-time' },
            endDate:     { type: 'string', format: 'date-time' },
            totalPrice:  { type: 'number', example: 1500000 },
            status:      { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'pending' },
            image:       { type: 'string', nullable: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' }
          }
        },

        /** Response bọc bởi sendSuccess cho một order */
        OrderResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data:    { $ref: '#/components/schemas/Order' },
            meta:    { nullable: true, example: null }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    typeof __dirname !== 'undefined' ? path.join(__dirname, '../routes/*.ts') : '',
    typeof __dirname !== 'undefined' ? path.join(__dirname, '../routes/*.js') : '',
    path.join(process.cwd(), 'src/routes/*.ts'),
    path.join(process.cwd(), 'src/routes/*.js')
  ].filter(Boolean)
};

export const swaggerSpec = swaggerJsdoc(options);

