# 🥗 NutriApp

A full-stack web application for nutritionist practice management. Built for a professional nutritionist to manage patients, appointments, consultations, meal plans, and her public website — all from a single platform.

---

## ✨ Features

### 🔐 Admin Panel
- **Patients** — Complete patient records with clinical history, food anamnesis, priority levels (normal / high / urgent), and activation/deactivation
- **Appointments** — Day-by-day calendar with multi-location support, status tracking (pending / present / absent / cancelled), and Excel export
- **Consultations** — Full consultation records with anthropometric measurements, automatic BMI calculation, waist-hip ratio, and detailed history
- **Measurement Evolution** — Interactive charts showing weight, BMI, body fat %, and other metrics over time per patient
- **Meal Plans** — Weekly 7-day × 6-meal grid with macro tracking, recipe bank integration, and PDF + Excel export
- **Blog** — Full CRUD for posts with categories, linked recipes, and publish/draft/archive states
- **Statistics** — Dashboard with 6 Recharts graphs (patients per month, consultations by type, appointment attendance, age/sex distribution, active plans) with custom date range
- **Site Manager** — Edit all public website content (hero text, services, testimonials, stats, about section) from the panel
- **Configuration** — Profile photo, clinic data, social networks, and 6 color themes

### 🌐 Public Website
- Parallax hero section with dynamic content
- Services, testimonials, and stats (all editable from the panel)
- Blog with search and category filters
- Individual post pages with linked recipes
- Contact section with WhatsApp, phone, and email

### 🔒 Security
- JWT authentication with 30-day expiration and automatic logout on token expiry
- bcrypt password hashing
- Helmet security headers
- Rate limiting (global + stricter on auth routes)
- CORS whitelist
- Input validation on all critical routes (express-validator + Zod)
- Production error handler that hides stack traces

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI library with static typing |
| Vite | Fast bundler for dev and production |
| Tailwind CSS | Utility-first CSS with CSS custom properties for theming |
| React Router v6 | Client-side routing (SPA) |
| Zustand | Global state management (auth, config) |
| React Hook Form + Zod | Form handling and schema validation |
| Axios | HTTP client with JWT interceptor |
| Recharts | Interactive charts for statistics |
| SheetJS (xlsx) | Excel file generation |
| jsPDF | PDF generation for meal plans |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| TypeScript | Static typing on the server |
| MySQL2 | Database driver with connection pool |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Secure password hashing |
| Helmet | HTTP security headers |
| express-rate-limit | Request throttling |
| express-validator | Input validation and sanitization |
| Multer | File upload handling (profile photos) |

### Database
- **MySQL 8.0** with utf8mb4 charset and connection pooling

---

## 📁 Project Structure

```
nutriapp/
├── backend/
│   └── src/
│       ├── config/          # Database connection
│       ├── controllers/     # Request handlers
│       ├── middlewares/     # Auth, validation, error handling
│       ├── models/          # SQL queries and TypeScript interfaces
│       ├── routes/          # API route definitions
│       ├── services/        # Business logic (auth, helpers)
│       ├── types/           # Shared TypeScript types
│       └── utils/           # Helper functions (IMC calc, etc.)
│
└── frontend/
    └── src/
        ├── components/      # Reusable UI components
        ├── hooks/           # Custom hooks (theme system)
        ├── pages/
        │   ├── panel/       # Protected admin pages
        │   └── publico/     # Public website pages
        ├── services/        # API service layer + export utils
        ├── stores/          # Zustand global state
        └── types/           # Shared TypeScript types
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8.0

### Installation

```bash
# Clone the repository
git clone https://github.com/Gonza28fq/nutriapp.git
cd nutriapp

# Install all dependencies
npm run install:all
```

### Environment Setup

Create `backend/.env`:
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=nutri_app
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=/api
```

### Database

Run the SQL schema script to create all tables:
```bash
mysql -u root -p nutri_app < database/schema.sql
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or separately:
npm run dev:backend   # http://localhost:3001
npm run dev:frontend  # http://localhost:5173
```

---

## 🌍 Deployment

| Service | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend API | Railway | ~$5/month |
| MySQL Database | Railway | Included |

### Environment Variables (Production)

**Railway (Backend):**
```
NODE_ENV=production
JWT_SECRET=<long-random-string>
JWT_EXPIRES_IN=30d
MYSQLHOST=<from Railway>
MYSQLPORT=<from Railway>
MYSQLUSER=<from Railway>
MYSQLPASSWORD=<from Railway>
MYSQLDATABASE=<from Railway>
FRONTEND_URL=https://your-app.vercel.app
```

**Vercel (Frontend):**
```
VITE_API_URL=https://your-backend.up.railway.app/api
```

---

## 📊 Database Schema

The application uses 18+ tables including:

`patients` · `appointments` · `consultations` · `measurements` · `clinical_history` · `food_anamnesis` · `meal_plans` · `plan_meals` · `recipes` · `blog_posts` · `blog_categories` · `configuration` · `site_sections` · `site_testimonials` · `site_services` · `site_stats` · `locations` · `users`

---

## 🎨 Theme System

NutriApp includes 6 built-in color themes (Pink, Purple, Green, Blue, Orange, Gray) managed via CSS custom properties on the `data-theme` attribute. Themes persist in both localStorage and the database.

---

## 📄 License

Private project — all rights reserved.

---

<p align="center">Built with ❤️ for Melina's nutrition practice</p>
