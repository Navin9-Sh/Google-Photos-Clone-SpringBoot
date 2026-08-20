A full-stack, cloud-based photo management platform built with Next.js and Spring Boot.

PixelVault allows users to securely create accounts, upload and manage photos, organize their media, and access AI-powered functionality through a modern web interface. The project follows a separated frontend-backend architecture and is deployed using cloud services for the application, database, and media storage.

## Live Demo

**Frontend:** https://pixelvault-gallery.vercel.app/

**Backend API:** https://marvelous-creativity-production-9b84.up.railway.app/

---

## Preview

<img width="1011" height="959" alt="Screenshot 2026-08-20 173853" src="https://github.com/user-attachments/assets/e5f46444-36c8-4577-b241-f34ca0835f50" />

<img width="1126" height="955" alt="Screenshot 2026-08-20 173840" src="https://github.com/user-attachments/assets/57880433-1ff4-4d60-9667-d572958ac131" />

<img width="1918" height="977" alt="Screenshot 2026-08-20 173658" src="https://github.com/user-attachments/assets/2acb50d7-ec2d-490f-9006-aa86fbba6f1c" />

<img width="1919" height="969" alt="Screenshot 2026-08-20 173742" src="https://github.com/user-attachments/assets/ad632170-4754-4f86-9766-cacb3ceaeda0" />

<img width="1895" height="972" alt="Screenshot 2026-08-20 171526" src="https://github.com/user-attachments/assets/e8ba0bbe-535b-4c0f-b34a-2be7a3000a6f" />

<img width="1850" height="974" alt="Screenshot 2026-08-20 174023" src="https://github.com/user-attachments/assets/681ea410-680d-4116-8709-584307f68711" />

<img width="1919" height="974" alt="Screenshot 2026-08-20 173807" src="https://github.com/user-attachments/assets/735e8973-6086-44bc-adee-fbe266ff9abe" />

<img width="1918" height="973" alt="Screenshot 2026-08-20 173753" src="https://github.com/user-attachments/assets/bf7878cd-9777-4b93-947b-4b284078d393" />


---

## Features

### Authentication

- User registration and login
- BCrypt password hashing
- JWT-based authentication
- Access token and refresh token flow
- Protected API endpoints
- Persistent authentication state
- Duplicate email validation
- Centralized error handling

### Photo Management

- Upload photos
- View uploaded photos
- Archive and restore photos
- Move photos to trash
- Restore deleted photos
- Permanently delete photos
- User-specific photo isolation

### AI-Powered Functionality

PixelVault also includes AI-powered functionality designed to make photo management more intelligent and interactive.

### Frontend

- Built with Next.js and React
- TypeScript support
- TanStack React Query for server-state management
- Zustand for client-side authentication state
- React Hook Form with Zod validation
- Centralized API layer
- Cache invalidation after photo operations
- Responsive UI

### Backend

- RESTful API built with Spring Boot
- Layered architecture
- Spring Security
- Stateless JWT authentication
- Custom JWT authentication filter
- Spring Data JPA
- PostgreSQL integration
- DTO-based API communication
- Centralized exception handling

---

## Architecture

<img width="1536" height="1024" alt="Architecture" src="https://github.com/user-attachments/assets/e74777b3-e926-453b-ae6b-b877952f44a9" />


### Request Flow

A typical authenticated request follows this flow:

```text
User Action
    ↓
Next.js Frontend
    ↓
REST API Request
    ↓
JWT Authentication
    ↓
Spring Boot Controller
    ↓
Service Layer
    ↓
Repository / External Storage
    ↓
PostgreSQL / ImageKit
    ↓
Response
    ↓
React Query Cache Update
    ↓
Updated UI
```

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- TanStack React Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT
- Maven

### Database & Cloud Services

- PostgreSQL
- Neon
- ImageKit

### Deployment

- Vercel — Frontend
- Railway — Backend
- Neon — PostgreSQL Database
- ImageKit — Image Storage and Delivery

---

## Project Structure

```text
PixelVault
│
├── frontend
│   ├── app
│   ├── components
│   ├── hooks
│   ├── lib
│   ├── stores
│   └── public
│
└── backend
    └── src/main/java
        └── project/backend
            ├── config
            ├── controller
            ├── domain
            ├── dto
            ├── exception
            ├── repository
            ├── security
            └── services
```

---

## Authentication Flow

PixelVault uses stateless authentication with JSON Web Tokens.

```text
User Login / Registration
          │
          ▼
    Spring Boot API
          │
          ▼
Password Verification
          │
          ▼
Generate Access Token
+
Generate Refresh Token
          │
          ▼
Return Authentication Response
          │
          ▼
Store Authentication State
          │
          ▼
Authenticated API Requests
```

Protected API requests include the access token:

```http
Authorization: Bearer <access_token>
```

The backend validates the token using a custom JWT authentication filter before allowing access to protected resources.

---

## Data Storage

PixelVault separates application data from media storage.

### PostgreSQL

PostgreSQL stores structured application data such as:

- Users
- Photo metadata
- Authentication-related data
- Refresh tokens
- Application state

### ImageKit

ImageKit is used for:

- Image storage
- Media delivery
- Cloud-hosted image URLs

This approach avoids storing large media files directly inside the relational database.

---

## Frontend State Management

The application uses two different approaches for managing state.

### Zustand

Used for client-side authentication state:

- Current user
- Access token
- Refresh token
- Authentication hydration state

Authentication data is persisted to maintain the session after a page refresh.

### TanStack React Query

Used for server state and API data:

- Fetching photos
- Fetching the current user
- Upload mutations
- Archive and restore operations
- Cache invalidation
- Server data synchronization

After photo-related mutations, relevant queries are invalidated to ensure the UI reflects the latest server state.

---

## Backend Architecture

The Spring Boot backend follows a layered architecture.

### Controller

Responsible for handling HTTP requests and returning API responses.

### Service

Contains the application's business logic.

Examples include:

- User registration
- Login
- Token generation
- Photo operations
- Media handling

### Repository

Uses Spring Data JPA to interact with PostgreSQL.

### DTO

Defines the data exchanged between the frontend and backend without directly exposing persistence entities.

### Security

Handles:

- JWT validation
- Authentication filters
- Protected routes
- Spring Security configuration

---

## Environment Variables

The backend uses environment variables for sensitive configuration.

Example:

```env
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=

APP_CORS_ALLOWED_ORIGINS=

APP_JWT_SECRET=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

The frontend requires the backend API URL:

```env
NEXT_PUBLIC_API_URL=
```

> Never commit production secrets, database passwords, JWT secrets, or private API keys to the repository.

---

## Running Locally

### Prerequisites

Make sure you have installed:

- Java 21
- Node.js
- PostgreSQL or a cloud PostgreSQL database
- Maven

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

---

### Run the Backend

```bash
cd backend
```

Configure the required environment variables.

Then run:

```bash
./mvnw spring-boot:run
```

The backend will run on:

```text
http://localhost:8080
```

---

### Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on:

```text
http://localhost:3000
```

---

## Deployment

PixelVault is deployed using a multi-service architecture.

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway |
| Database | Neon PostgreSQL |
| Media Storage | ImageKit |

The deployment workflow is Git-based:

```text
Local Development
        ↓
      GitHub
        ↓
 ┌──────┴──────┐
 ▼             ▼
Vercel       Railway
Frontend     Backend
Deploy       Deploy
```

Environment-specific configuration is managed through deployment platform environment variables.

---

## Key Learnings

Building PixelVault provided hands-on experience with:

- Designing a frontend and backend as separate applications
- Building REST APIs with Spring Boot
- Implementing authentication with Spring Security and JWT
- Managing access and refresh tokens
- Working with PostgreSQL using Spring Data JPA
- Integrating cloud-based media storage
- Managing client-side and server-side state
- Handling caching and cache invalidation
- Implementing user-specific data access
- Configuring CORS between independently deployed services
- Managing environment variables and application secrets
- Deploying a full-stack application to production

---

## Future Improvements

Some areas I would like to continue improving include:

- Advanced AI-powered photo search
- Automatic image categorization
- Smart album generation
- Image sharing between users
- Improved search and filtering
- Pagination and infinite scrolling
- Background processing for large uploads
- Rate limiting
- Automated testing
- CI/CD pipelines
- Monitoring and observability

---

## Author

**Peter**

Built as a hands-on full-stack project to explore modern frontend development, backend architecture, authentication, cloud storage, and production deployment.

---

## License

This project is available for learning and educational purposes.
