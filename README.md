# DOCAPPOINTER - Healthcare Management System

A complete full-stack healthcare management system with Oracle database.

## 📁 Project Structure

```
DOC_APPOINTER_by_me/
├── backend/              # Node.js + Express API
├── frontend/             # React + Vite application
├── sql/                  # Database scripts (functions, procedures, triggers)
└── PROJECT_DOCUMENTATION/  # All documentation and archived files
```

## 🚀 Quick Start

### 1. Database Setup
```bash
sqlplus APP/your_password@your_database
@sql/CREATE_FUNCTIONS.sql
@sql/CREATE_PROCEDURES_ONLY.sql
@sql/CREATE_TRIGGERS.sql
@sql/VERIFY_FUNCTIONS.sql
```

### 2. Backend
```bash
cd backend
npm install
npm start
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Database Objects

- **3 Functions**: Statistical calculations
- **1 Procedure**: Multi-step workflow  
- **2 Trigger**: Audit logging

## 📖 Documentation

All documentation is in `PROJECT_DOCUMENTATION/`:
- SQL scripts
- Requirements compliance
- Setup guides
- API documentation

See `PROJECT_DOCUMENTATION/README.md` for details.

## 🎯 Features

- Admin dashboard with analytics
- Doctor appointment management
- Patient booking system
- Hospital management
- JWT authentication
- Role-based access control

## 🔐 Default Credentials

- Admin: `admin@hospital.com` / `password`
- Doctor: `doctor@hospital.com` / `password`
- Patient: `patient@hospital.com` / `password`

---

**Status**: ✅ Complete and ready for submission
