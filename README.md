# MobiFlow – Manufacturing Management System

A complete MERN stack application for managing mobile and smart electronics components manufacturing.

## 🚀 Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Validation**: Joi

## 📦 Modules

1. **User & Role Management** – Registration, login, RBAC
2. **Raw Material Management** – Supplier tracking, low stock alerts
3. **Manufacturing & Assembly** – Batch creation, BOM, stage progression
4. **Quality Control** – Inspections, defect tracking, pass/fail reports
5. **Inventory & Warehouse** – Real-time stock, auto-status updates
6. **Distributor & Order Management** – Order lifecycle management
7. **Distribution & Dispatch** – Shipment tracking, delivery updates
8. **Reporting & Dashboard** – KPIs, analytics, reports

## 🏗️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running on `localhost:27017`

### 1. Clone and Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 2. Configure Environment

The `.env` file is in `server/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/mobiflow
JWT_SECRET=mobiflow_super_secret_key_2024_se_project
JWT_EXPIRES_IN=7d
```

### 3. Seed Database

```bash
cd server
npm run seed
```

### 4. Start Application

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mobiflow.com | admin123 |
| Employee | john@mobiflow.com | employee123 |
| Distributor | techmart@dist.com | dist123 |

## 📡 API Endpoints

### Auth
- `POST /auth/register` – Register user
- `POST /auth/login` – Login
- `GET /auth/users` – Get all users (admin)
- `PUT /auth/users/role` – Update role (admin)

### Raw Materials
- `POST /raw/add` – Add material
- `PUT /raw/update/:id` – Update material
- `GET /raw/all` – Get all materials
- `GET /raw/low-stock` – Low stock alerts

### Manufacturing
- `POST /manufacturing/create` – Create batch
- `PUT /manufacturing/update/:id` – Update batch
- `GET /manufacturing/all` – Get all batches

### Quality Control
- `POST /qc/add` – Record inspection
- `GET /qc/report` – Get QC reports

### Inventory
- `POST /inventory/add` – Add item
- `PUT /inventory/update/:id` – Update item
- `GET /inventory/all` – Get all items
- `GET /inventory/low-stock` – Low stock

### Orders
- `POST /order/place` – Place order
- `PUT /order/update/:id` – Update status
- `GET /order/all` – All orders
- `GET /order/:id` – Single order
- `GET /order/history/:distributorId` – Order history

### Dispatch
- `POST /dispatch/create` – Create dispatch
- `PUT /dispatch/update/:id` – Update delivery
- `GET /dispatch/all` – All dispatches

### Dashboard & Reports
- `GET /dashboard` – Dashboard KPIs
- `GET /reports/inventory` – Inventory report
- `GET /reports/orders` – Orders report

## 📁 Project Structure

```
MobiFlow/
├── server/
│   ├── config/db.js
│   ├── middleware/auth.js, roleAuth.js
│   ├── models/ (7 Mongoose models)
│   ├── controllers/ (8 controllers)
│   ├── routes/ (8 route files)
│   ├── validators/validators.js
│   ├── seed/seed.js
│   ├── server.js
│   └── .env
├── client/
│   ├── src/
│   │   ├── api/axios.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/ (5 reusable)
│   │   ├── pages/ (10 pages)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── README.md
```
