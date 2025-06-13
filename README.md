# Taxsnap - Trade Tracking & Tax Filing Platform

**Snap your trades. File your taxes.**

A modern Next.js application with JWT authentication for tracking trades and filing taxes.

## 🚀 Features

### 🔐 Authentication System
- **JWT-based authentication** with access and refresh tokens
- **User registration** with email verification
- **Secure login/logout** functionality
- **Password management** (set/change password)
- **Protected routes** with middleware
- **Automatic token refresh** for seamless user experience
- **Server-side and client-side** authentication support

### 🎨 Frontend
- **Modern UI** built with Tailwind CSS and Radix UI components
- **Dark theme** support with theme provider
- **Responsive design** for all devices
- **Authentication dialogs** with real-time validation
- **Global auth state management** with React Context

### 🛡️ Security
- **HTTP-only cookies** for server-side authentication
- **JWT token validation** on protected routes
- **Automatic token refresh** with secure refresh tokens
- **CSRF protection** through proper token handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database (for production use)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd taxsnap/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/taxsnap"

# JWT Configuration
JWT_ACCESS_SECRET="your-super-secret-access-token-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-token-key-change-this-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# App Configuration
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

**⚠️ Important**: Change the JWT secrets to strong, unique values in production!

### 4. Database Setup
```bash
# Start the database (using Docker)
npm run db:start

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed the database
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## ��️ Architecture

### System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI["🖥️ Next.js Frontend<br/>React Components"]
        Auth["🔐 Auth Context<br/>Global State"]
    end
    
    subgraph "API Layer"
        API["🌐 Next.js API Routes<br/>/api/*"]
        MW["🛡️ Middleware<br/>Route Protection"]
    end
    
    subgraph "Business Layer"
        SVC["⚙️ Services<br/>Business Logic"]
        REPO["📦 Repositories<br/>Data Access"]
    end
    
    subgraph "Data Layer"
        DB["🗄️ PostgreSQL<br/>Database"]
        PRISMA["🔧 Prisma ORM<br/>Schema & Queries"]
    end
    
    subgraph "External"
        EMAIL["📧 Email Service<br/>Verification"]
    end
    
    UI --> Auth
    Auth --> API
    API --> MW
    MW --> SVC
    SVC --> REPO
    REPO --> PRISMA
    PRISMA --> DB
    SVC --> EMAIL
    
    style UI fill:#e3f2fd
    style Auth fill:#f3e5f5  
    style API fill:#e8f5e8
    style MW fill:#fff3e0
    style SVC fill:#fce4ec
    style REPO fill:#f1f8e9
    style DB fill:#e1f5fe
    style PRISMA fill:#f9fbe7
    style EMAIL fill:#fff8e1
```

### Data Flow & Type System

```mermaid
graph LR
    subgraph "Database Layer"
        PRISMA_USER["🗄️ Prisma User<br/>(Generated Type)"]
    end
    
    subgraph "Repository Layer"  
        REPO_USER["📦 Repository User<br/>(string dates)"]
    end
    
    subgraph "Service Layer"
        SVC_USER["⚙️ Service User<br/>(string dates)"]  
    end
    
    subgraph "API Layer"
        USER_RESPONSE["🌐 UserResponse<br/>(Date objects)"]
        AUTH_RESPONSE["🔐 AuthResponse<br/>(Date objects)"]
    end
    
    subgraph "Client Layer"
        CLIENT_USER["📱 ClientUser<br/>(string dates)"]
        CONTEXT["⚛️ Auth Context<br/>(ClientUser)"]
    end
    
    PRISMA_USER --> REPO_USER
    REPO_USER --> SVC_USER  
    SVC_USER --> USER_RESPONSE
    USER_RESPONSE --> AUTH_RESPONSE
    AUTH_RESPONSE --> CLIENT_USER
    CLIENT_USER --> CONTEXT
    
    style PRISMA_USER fill:#e1f5fe
    style REPO_USER fill:#f3e5f5
    style SVC_USER fill:#f3e5f5  
    style USER_RESPONSE fill:#e8f5e8
    style AUTH_RESPONSE fill:#fff3e0
    style CLIENT_USER fill:#fce4ec
    style CONTEXT fill:#fce4ec
```

### JWT Authentication Flow

```mermaid
graph TD
    A["👤 User Login"] --> B["🔍 API Validates Credentials"]
    B --> C["🔑 Generate JWT Tokens"]
    C --> D["💾 Store in LocalStorage + Context"]
    D --> E["🚪 Access Protected Routes"]
    E --> F["⏰ Token Expires?"]
    F -->|Yes| G["🔄 Auto Refresh Token"]
    F -->|No| H["✅ Continue Request"]
    G --> I["✓ Valid Refresh Token?"]
    I -->|Yes| J["🆕 Generate New Access Token"]
    I -->|No| K["🚪 Redirect to Login"]
    J --> H
    
    style A fill:#e3f2fd
    style B fill:#e8f5e8
    style C fill:#fff3e0
    style D fill:#fce4ec
    style E fill:#f1f8e9
    style G fill:#fff8e1
    style K fill:#ffebee
```

### Project Structure
```
taxsnap/frontend/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/         # Authentication endpoints
│   │   │   ├── login/    # POST /api/auth/login
│   │   │   └── refresh/  # POST /api/auth/refresh
│   │   ├── users/        # User management endpoints
│   │   │   ├── register/ # POST /api/users/register
│   │   │   ├── verify/   # POST /api/users/verify
│   │   │   └── [userId]/ # User CRUD operations
│   │   └── health/       # Health check endpoint
│   ├── components/       # App-specific components
│   ├── dashboard/        # Protected dashboard pages
│   ├── verify-account/   # Account verification page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── lib/                   # Core application logic
│   ├── api/              # API client & utilities
│   │   ├── client.ts     # Main API client
│   │   ├── errors.ts     # Custom error classes
│   │   └── utils.ts      # API utilities
│   ├── contexts/         # React contexts
│   │   ├── auth-context.tsx # Authentication state
│   │   └── theme-provider.tsx # Theme management
│   ├── hooks/            # Custom React hooks
│   ├── repositories/     # Data access layer
│   │   ├── prisma.ts     # Prisma client setup
│   │   └── user-repository.ts # User data access
│   ├── services/         # Business logic layer
│   │   ├── jwt-service.ts # JWT token management
│   │   ├── user-service.ts # User business logic
│   │   └── email-service.ts # Email notifications
│   ├── types/            # TypeScript type definitions
│   │   └── user.ts       # User-related types
│   ├── utils/            # Utility functions
│   │   ├── auth.ts       # Auth utilities
│   │   └── seed.ts       # Database seeding
│   └── generated/        # Generated files (Prisma)
├── components/           # Shared UI components
│   ├── ui/              # Base UI components (shadcn/ui)
│   └── auth-dialog.tsx  # Authentication modal
├── prisma/              # Database schema & migrations
│   └── schema.prisma    # Database schema
├── public/              # Static assets
├── middleware.ts        # Next.js middleware for route protection
├── docker-compose.yml   # Docker services (PostgreSQL)
├── Dockerfile          # Container configuration
└── package.json        # Dependencies & scripts
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### User Management
- `POST /api/users/register` - User registration (email + password)
- `POST /api/users/verify` - Email verification
- `POST /api/users/resend-verification` - Resend verification email
- `GET /api/users/[userId]` - Get user details
- `PUT /api/users/[userId]` - Update user
- `DELETE /api/users/[userId]` - Delete user
- `POST /api/users/[userId]/password` - Set password
- `PUT /api/users/[userId]/password` - Change password

### Health Check
- `GET /api/health` - Service health status

### Request/Response Examples

#### Registration Request
```json
POST /api/users/register
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Login Request
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### Login Response
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "verified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 🧪 Testing the Authentication

### 1. User Registration
1. Click "Sign Up" in the navigation
2. Enter your email address and password
3. Check your email for verification link
4. Click the verification link to activate your account

### 2. User Login
1. Click "Login" in the navigation
2. Enter your email and password
3. You'll be redirected to the dashboard if verified
4. Unverified users are redirected to the verification page

### 3. Protected Routes
- Try accessing `/dashboard` without logging in
- You should be redirected to the home page
- After login, you can access protected areas

### 4. Token Management
- Tokens are automatically refreshed every 15 minutes
- If refresh fails, you'll be logged out automatically
- Logout clears all tokens and redirects to home

## 🛡️ Security Considerations

### JWT Configuration
- **Access tokens** expire in 15 minutes (configurable)
- **Refresh tokens** expire in 7 days (configurable)
- Tokens are stored in localStorage for client-side access
- Server-side middleware validates tokens on protected routes

### Password Security
- Passwords are hashed using bcrypt with 12 rounds
- No passwords are stored in plain text
- Password validation on both client and server

### Route Protection
- Middleware protects sensitive routes
- Unverified users can't access dashboard
- Invalid tokens result in automatic logout

### Type Safety
- Strict TypeScript configuration
- Separate type definitions for different layers
- Runtime validation for API requests/responses

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:start     # Start PostgreSQL with Docker
npm run db:stop      # Stop database containers
npm run db:seed      # Seed database with sample data

# Development Tools
npm run postinstall  # Generate Prisma client (runs automatically)
```

## 🚀 Deployment

### Environment Variables for Production
Make sure to set these environment variables in your production environment:
- `DATABASE_URL` - Your production database connection string
- `JWT_ACCESS_SECRET` - Strong secret for access tokens
- `JWT_REFRESH_SECRET` - Strong secret for refresh tokens
- `NEXT_PUBLIC_BASE_URL` - Your production domain

### Build Commands
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**JWT Token Errors**
- Ensure JWT secrets are set in environment variables
- Check that tokens haven't expired
- Verify middleware configuration

**Database Connection Issues**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Run `npx prisma db push` to sync schema

**Build Errors**
- Clear `.next` directory: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run lint`

**Type Confusion**
- Review the Data Flow diagram above
- Use `ClientUser` for client-side state
- Use `UserResponse` for API responses
- Use repository `User` interface for data access

For more help, please open an issue in the repository.
