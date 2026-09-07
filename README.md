# B2B/B2C E-Commerce Platform

A production-ready e-commerce platform built for both Retail (B2C) and Wholesale (B2B) customers. Features a robust Java Spring Boot backend, a lightning-fast React + Vite frontend, and a PostgreSQL database.

## 🌟 Key Features
- **Dual-Pricing Engine**: Seamlessly handles Retail and Wholesale pricing based on the authenticated user's `CustomerGroup`.
- **Wholesale MOQ Enforcer**: Enforces Minimum Order Quantities (MOQ) natively during the checkout process for B2B accounts.
- **Stripe Payments**: Real-time Stripe checkout integration, complete with secure webhook listeners for asynchronous stock deduction.
- **PostgreSQL Full-Text Search**: Custom native queries utilizing `to_tsvector` to deliver incredibly fast product searches.
- **Inventory Management**: Automated out-of-stock protections and a dedicated Admin Dashboard highlighting low-stock items.
- **Automated Emails**: HTML order confirmation receipts routed through Brevo SMTP upon successful payment.
- **Docker Ready**: Pre-configured `Dockerfile`s and `docker-compose.yml` for effortless orchestration.

## 🏗️ Technology Stack
### Backend
- Java 17
- Spring Boot 3.2 (Web, Data JPA, Validation)
- PostgreSQL Driver
- Stripe Java SDK
- Spring Boot Starter Mail (JavaMail)
- JJWT (JSON Web Tokens)

### Frontend
- React 18
- Vite
- Tailwind CSS 3
- React Router DOM
- Axios
- Lucide React (Icons)

---

## 🚀 Local Development Setup

### Prerequisites
- JDK 17
- Node.js 20+
- PostgreSQL 15+ installed locally (or running via Docker)

### 1. Database Configuration
Create a local PostgreSQL database:
```sql
CREATE DATABASE ecommerce_db;
```
Ensure your `backend/src/main/resources/application.properties` matches your local credentials (default username: `postgres`, password: `1234`).

### 2. Run the Backend (Spring Boot)
Navigate to the `backend` directory and use the Maven wrapper:
```bash
cd backend
./mvnw clean install
./mvnw spring-boot:run
```
The API will start on `http://localhost:8080`.

*(Note: The `DataSeeder` runs automatically on startup if the database is empty, instantly populating your catalog with sample items!)*

### 3. Run the Frontend (Vite)
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
The storefront will start on `http://localhost:5173` (or `5174`).

---

## 🐳 Docker Deployment

To spin up the entire application (Database, Backend API, and Nginx-served Frontend) using Docker Compose:

1. Ensure Docker Desktop is running.
2. In the root directory, execute:
```bash
docker-compose up --build -d
```
3. The frontend is accessible at `http://localhost` and the backend at `http://localhost:8080`.

---

## 🔐 Environment Variables (Production)

For production deployments (like Render, Heroku, or an AWS VPS), we use external environment variables. 
Reference the provided `.env.example` files. 

**Backend Variables:**
- `SPRING_PROFILES_ACTIVE=prod` (activates `application-prod.properties`)
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (e.g., Neon.tech URI)
- `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- `BREVO_SMTP_USER`, `BREVO_SMTP_PASS`
- `JWT_SECRET`
- `FRONTEND_URL`

**Frontend Variables:**
Create a `.env` file in the `frontend` directory.
- `VITE_API_BASE_URL` (Points to your live backend domain).
