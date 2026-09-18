# VOLTRA API

---

## Project Description

**VOLTRA API** is a RESTful backend application for an electric vehicle charging station booking platform built with **NestJS**, **PostgreSQL**, and **Prisma ORM**. The API provides the backend services required by the VOLTRA frontend, including user authentication, charging station and charging slot management, charging reservations, payment processing, booking adjustments, and transaction history.

The project demonstrates:

- Database design using PostgreSQL
- RESTful API development with NestJS
- Prisma ORM integration
- CRUD operations
- Relational database queries
- DTO validation using `class-validator`
- JWT access and refresh token authentication
- Password hashing using `bcrypt`
- Role-based access control
- Resource ownership authorization
- Booking and payment business logic
- Swagger API documentation
- API testing using Postman
- Cloud database integration using Neon PostgreSQL
- Backend deployment using Vercel

---

## Live API

The VOLTRA backend is deployed to **Vercel** and connected to a hosted PostgreSQL database.

### Base URL

```text
https://voltra-backend.vercel.app/api
```

---

## Available Endpoints

### Health

```text
GET     /health
```

### Authentication

```text
POST    /auth/register
POST    /auth/login
POST    /auth/refresh
```

### Users

```text
GET     /users
GET     /users/me
GET     /users/:id
POST    /users
PATCH   /users/:id
DELETE  /users/:id
```

### Charging Stations

```text
GET     /stations
GET     /stations/:id
POST    /stations
PATCH   /stations/:id
DELETE  /stations/:id
```

### Charging Slots

```text
GET     /charging-slots
GET     /charging-slots/:id
POST    /charging-slots
PATCH   /charging-slots/:id
DELETE  /charging-slots/:id
```

### Bookings

```text
GET     /bookings
GET     /bookings/:id
POST    /bookings
PATCH   /bookings/:id
DELETE  /bookings/:id
```

### Payments

```text
GET     /payments
GET     /payments/history
GET     /payments/:id
POST    /payments
PATCH   /payments/:id
DELETE  /payments/:id
```

### Booking Adjustments

```text
GET     /booking-adjustments/:id
POST    /booking-adjustments/:id/complete
```

---

## Tech Stack

- NestJS 11
- TypeScript
- Node.js
- PostgreSQL
- Prisma ORM
- Neon PostgreSQL
- Passport
- Passport JWT
- JSON Web Token (JWT)
- bcrypt
- class-validator
- class-transformer
- Swagger / OpenAPI
- Postman
- Vercel

---

## Features

- User registration and authentication
- Secure password hashing using `bcrypt`
- JWT access token authentication
- Refresh token support
- User and administrator roles
- Role-Based Access Control (RBAC)
- Resource ownership authorization
- User management
- Charging station management
- Charging slot management
- Charging booking management
- Charging cost calculation
- Estimated charging energy calculation
- Payment management
- Booking payment adjustments
- Additional payment handling
- Refund handling
- Payment transaction history
- Relational queries using Prisma
- Request validation using DTOs and `class-validator`
- Protected REST API endpoints
- Swagger API documentation
- Postman API testing
- PostgreSQL relational database
- Cloud deployment using Vercel

---

## Architecture

VOLTRA API follows a modular RESTful architecture built with NestJS. The backend is organized into feature-based modules, with each module responsible for a specific part of the EV charging reservation platform.

### Module Structure

- **Auth Module** – Handles registration, login, password verification, JWT generation, refresh tokens, and authentication.
- **Users Module** – Handles user profiles and user management.
- **Stations Module** – Manages EV charging station information and administrative station operations.
- **Charging Slots Module** – Manages individual charging slots belonging to charging stations, including charger type, charging power, price, and availability.
- **Bookings Module** – Handles charging reservations, booking schedules, estimated energy usage, estimated costs, booking ownership, and booking adjustments.
- **Payments Module** – Handles booking payments, payment status, payment methods, and payment transaction history.
- **Booking Adjustments Module** – Handles additional payments and refunds resulting from modifications to previously paid bookings.
- **Prisma Module** – Provides the Prisma database client to the application through NestJS dependency injection.

NestJS controllers receive HTTP requests and delegate business logic to services. Services communicate with PostgreSQL through Prisma ORM.

The general request flow is:

```text
Client
  ↓
Controller
  ↓
Guard / Validation
  ↓
Service
  ↓
Prisma ORM
  ↓
PostgreSQL
```

This modular structure separates responsibilities between authentication, users, charging infrastructure, bookings, and payments, making the application easier to maintain and extend.

---

## Authentication and Authorization

VOLTRA API uses JWT-based authentication together with role-based and ownership-based authorization.

### Authentication Flow

1. A new user registers through `POST /auth/register`.
2. The user's password is hashed using `bcrypt` before being stored in PostgreSQL.
3. The user authenticates through `POST /auth/login`.
4. After successful authentication, the API generates authentication tokens.
5. The frontend sends the access token with protected API requests:

```text
Authorization: Bearer <accessToken>
```

6. `JwtAuthGuard` verifies the access token.
7. The authenticated user's information becomes available through `req.user`.
8. Protected services can use `req.user.id` to determine ownership of resources.
9. When the access token expires, the refresh-token endpoint can issue a new access token.

The authentication flow can be summarized as:

```text
Client
  ↓
Login
  ↓
Credentials Validation
  ↓
JWT Access + Refresh Token
  ↓
Bearer Access Token
  ↓
JwtAuthGuard
  ↓
Protected Resource
```

### Role-Based Access Control

VOLTRA supports two roles:

```text
USER
ADMIN
```

`USER` accounts can access and manage resources belonging to themselves, such as their bookings and payments.
`ADMIN` accounts have additional permissions for administrative resources such as charging stations, charging slots, users, and booking management.

Administrative endpoints use `RolesGuard` together with role metadata to restrict access.

```text
Client
  ↓
JWT
  ↓
JwtAuthGuard
  ↓
User Identity
  ↓
RolesGuard / Ownership Check
  ↓
Controller
  ↓
Service
```

### Ownership Authorization

Authentication alone does not allow a user to access another user's private resources. For resources such as bookings and payments, the backend compares the authenticated user's ID against the owner of the requested resource.

For example:

```text
Authenticated User
       ↓
GET /bookings/:id
       ↓
Find Booking
       ↓
Compare booking.userId
with req.user.id
       ↓
     Match?
    /      \
  YES       NO
   ↓         ↓
Allow     403 Forbidden
```

Administrators can be given broader access where required by the application.

---

## Booking and Payment Flow

The backend manages the complete lifecycle of a charging reservation.

```text
User
 ↓
Select Charging Slot
 ↓
Create Booking
 ↓
Calculate Estimated kWh
 ↓
Calculate Estimated Cost
 ↓
Booking Created
 ↓
Create Payment
 ↓
Complete Payment
 ↓
Booking Management
```

A newly created booking begins with its configured booking status and is associated with a user and charging slot. The backend calculates booking information from the selected charging slot, charging duration, power, and charging price.

---

## Paid Booking Adjustment

VOLTRA supports modifying bookings that have already been paid. Instead of overwriting the original payment transaction, later financial changes are stored as booking adjustments.

The API calculates:

```text
Net Paid Amount =
Original Payment
+ Completed Additional Payments
- Completed Refunds
```

When a paid booking is changed:

```text
New Estimated Cost
        ↓
Compare with Net Paid Amount
        ↓
┌─────────────────┬─────────────────┬─────────────────┐
│ Same Amount     │ Higher Amount   │ Lower Amount    │
│       ↓         │       ↓         │       ↓         │
│ Update Booking  │ Additional      │ Refund          │
│                 │ Payment         │ Adjustment      │
└─────────────────┴─────────────────┴─────────────────┘
```

### Additional Payment

If the updated booking costs more than the net amount already paid, the backend creates a pending `ADDITIONAL_PAYMENT` adjustment for the difference. The original payment remains unchanged.

### Refund

If the updated booking costs less than the net amount already paid, the backend records a `REFUND` adjustment representing the difference.

### Transaction History

The payment history combines:

- Original payments
- Completed additional payments
- Completed refunds

This provides a transaction ledger without replacing the original payment record.

---

## Database Models

The main database models used by VOLTRA are:

```text
User
ChargingStation
ChargingSlot
Booking
Payment
BookingAdjustment
```

### Main Relationships

```text
User
 │
 └──< Booking

ChargingStation
 │
 └──< ChargingSlot

ChargingSlot
 │
 └──< Booking

Booking
 ├── Payment
 └──< BookingAdjustment
```

### Users → Bookings

- One user can create multiple bookings.
- Each booking belongs to one user.

### Charging Stations → Charging Slots

- One charging station can contain multiple charging slots.
- Each charging slot belongs to one charging station.

### Charging Slots → Bookings

- One charging slot can be associated with multiple bookings over time.
- Each booking references one charging slot.

### Bookings → Payments

- A booking can have one original payment.
- Each payment belongs to one booking.

### Bookings → Booking Adjustments

- A booking can contain multiple payment adjustments.
- Adjustments can represent additional payments or refunds.

---

## ERD

The Entity Relationship Diagram illustrates the PostgreSQL database structure used by the VOLTRA backend.

![VOLTRA ERD](./voltra-backend/docs/voltra_ERD.png)

---

## Environment Variables

Create a `.env` file in the project root based on `.env.example`.

Example:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

JWT_SECRET="your-jwt-secret"

JWT_REFRESH_SECRET="your-refresh-jwt-secret"

FRONTEND_URL="http://localhost:3000"

PORT=3001
```

> Use the exact environment-variable names from your current VOLTRA backend `.env.example` before submission.

### Environment Variable Description

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma ORM. |
| `JWT_SECRET` | Secret used to sign and verify JWT access tokens. |
| `JWT_REFRESH_SECRET` | Secret used for refresh-token authentication. |
| `FRONTEND_URL` | Allowed frontend origin used by the backend CORS configuration. |
| `PORT` | Port used by the NestJS backend locally. |

Sensitive environment variables should not be committed to the GitHub repository.

---

## Running the Project Locally

### 1. Clone the Repository

```bash
git clone <https://github.com/Revou-FSSE-Feb26/crack-be-Arzy4.git>
```

### 2. Navigate into the Backend Project

```bash
cd <voltra-backend>
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file and configure the required environment variables.

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-jwt-secret"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Run Database Migrations

For local development:

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

### 7. Seed the Database

If the project seed script is configured:

```bash
npx prisma db seed
```

### 8. Start the Backend

```bash
npm run start:dev
```

The backend API will be available locally at:

```text
http://localhost:3001/api
```

---

## Database Setup with Prisma

VOLTRA uses **Prisma ORM** as its database access layer.

### Generate Prisma Client

```bash
npx prisma generate
```

### Create a Development Migration

```bash
npx prisma migrate dev
```

### Deploy Existing Migrations

```bash
npx prisma migrate deploy
```

### Seed the Database

```bash
npx prisma db seed
```

### Open Prisma Studio

```bash
npx prisma studio
```

Prisma Studio provides a graphical interface for viewing and managing development database records.

---

## API Documentation

VOLTRA API uses **Swagger / OpenAPI** for interactive API documentation.

Swagger provides:

- Available API endpoints
- HTTP methods
- Request body schemas
- DTO validation requirements
- Path parameters
- Response information
- Bearer token authorization
- Interactive API testing

For protected endpoints, authenticate using a valid JWT access token through the Swagger **Authorize** option.

### Swagger URL

```text
<http://localhost:3001/api/docs>
```

---

## Postman Collection

VOLTRA includes a Postman collection for integration and smoke testing.

The collection covers the main API flows, including:

- Health check
- User registration
- User login
- JWT authentication
- Charging station requests
- Charging slot requests
- Booking creation and management
- Payment creation and management
- Authentication failure testing
- Role-based authorization testing
- Admin-only operations

Protected requests use:

```text
Authorization: Bearer {{token}}
```

The Postman environment can store values such as:

```text
baseUrl
token
adminToken
```

This allows authenticated requests to be tested without manually entering the JWT for every endpoint.

---

## API Request and Response Documentation

Complete request and response examples for VOLTRA endpoints should be maintained in the API documentation and/or smoke-test documentation.

Example authenticated request:

```http
GET /api/bookings
Authorization: Bearer <accessToken>
```

Example successful response structure:

```json
{
  "message": "Bookings retrieved successfully",
  "data": []
}
```

Example unauthorized response:

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

Example forbidden response:

```json
{
  "message": "Forbidden resource",
  "statusCode": 403
}
```

---

## Deployment

The VOLTRA backend is deployed using **Vercel**.

### Production API

```text
https://voltra-backend.vercel.app/api
```

The deployed application connects to a hosted PostgreSQL database using the production `DATABASE_URL`.

The frontend deployment communicates with this API through its configured `NEXT_PUBLIC_API_URL`.

### Frontend

```text
https://voltra-app-xi.vercel.app
```

---

## Project Structure

```text
.
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── auth/
│   ├── users/
│   ├── stations/
│   ├── charging-slots/
│   ├── bookings/
│   ├── payments/
│   ├── booking-adjustments/
│   ├── prisma/
│   ├── app.module.ts
│   └── main.ts
│
├── docs/
│   ├── Voltra_ERD.png
│   ├── voltra.postman_collection.json
│   ├── voltra.postman_environment.json
│   └── api-smoke-test.md
│
├── .env.example
├── package.json
└── README.md
```

---

## Related Application

### VOLTRA Frontend

The VOLTRA frontend provides the user-facing interface for charging station discovery, reservations, payments, transaction history, profiles, and administrative management.

🔗 [View Live VOLTRA EV Charging Platform](https://voltra-app-xi.vercel.app)