# Medical Technician Add Flow - Complete File Reference

## Issue
Error: `ORA-02291: integrity constraint (APP.FK_TECH_BRANCH) violated - parent key not found`

**Cause:** Entering Branch ID or Department ID that doesn't exist in database.

**Solution:** Leave Branch ID and Department ID fields EMPTY if you don't have valid IDs.

---

## Frontend Files

### 1. `frontend/src/pages/AdminDashboard.jsx`
**Location:** Lines 435-520 (Medical Technician Form)

**What it sends to backend:**
```javascript
POST http://localhost:3000/api/admin/medical-technicians

Headers:
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>'
}

Body:
{
  name: "Technician Name",
  email: "tech@example.com",
  phone: "01234567890",
  degrees: "BSc Medical Technology",  // optional
  experienceYears: 5,                  // optional
  deptId: 1,                           // optional - MUST be valid DEPARTMENTS.ID or empty
  branchId: 2                          // optional - MUST be valid HOSPITAL_BRANCHES.ID or empty
}
```

**Form Fields:**
- Name * (required)
- Email * (required)
- Phone * (required)
- Degrees (optional)
- Experience Years (optional)
- Department ID (optional) - ⚠️ Must exist in DEPARTMENTS table
- Branch ID (optional) - ⚠️ Must exist in HOSPITAL_BRANCHES table

---

## Backend Files

### 2. `backend/routes/adminRoutes.js`
**Location:** Line 30

```javascript
router.post('/medical-technicians', medicalTechnicianController.addTechnician);
```

**Middleware Applied:**
- `authenticateToken` - Validates JWT token, sets `req.user`
- `requireAdmin` - Checks if user role is ADMIN

---

### 3. `backend/controllers/medicalTechnicianController.js`
**Location:** `exports.addTechnician` function (lines 42-115)

**What it receives:**
```javascript
req.body = {
  name, email, phone, degrees, experienceYears, deptId, branchId
}
req.user.id = <USER_ID from JWT token>
```

**What it does:**
1. Validates required fields (name, email, phone)
2. Validates experienceYears >= 0
3. Gets ADMIN.ID from USERS_ID using `req.user.id`
4. Checks if email already exists
5. Converts empty strings to NULL for optional fields
6. Inserts into MEDICAL_TECHNICIAN table

**What it returns:**

Success (201):
```javascript
{
  message: 'Medical technician added successfully'
}
```

Error (400):
```javascript
{
  error: 'Name, email, and phone are required'
}
// OR
{
  error: 'Experience years must be 0 or greater'
}
```

Error (403):
```javascript
{
  error: 'Admin record not found'
}
```

Error (409):
```javascript
{
  error: 'Email already exists'
}
```

Error (500):
```javascript
{
  error: 'Failed to add technician: <error message>'
}
```

---

## Database Tables Involved

### MEDICAL_TECHNICIAN Table
```sql
CREATE TABLE MEDICAL_TECHNICIAN (
  ID NUMBER PRIMARY KEY,
  ADMIN_ID NUMBER NOT NULL,           -- FK to ADMIN.ID
  NAME VARCHAR2(100) NOT NULL,
  EMAIL VARCHAR2(100) UNIQUE NOT NULL,
  PHONE VARCHAR2(11) NOT NULL,
  DEGREES VARCHAR2(200),
  EXPERIENCE_YEARS NUMBER,
  DEPT_ID NUMBER,                     -- FK to DEPARTMENTS.ID (optional)
  BRANCH_ID NUMBER,                   -- FK to HOSPITAL_BRANCHES.ID (optional)
  CONSTRAINT FK_TECH_ADMIN FOREIGN KEY (ADMIN_ID) REFERENCES ADMIN(ID),
  CONSTRAINT FK_TECH_DEPT FOREIGN KEY (DEPT_ID) REFERENCES DEPARTMENTS(ID),
  CONSTRAINT FK_TECH_BRANCH FOREIGN KEY (BRANCH_ID) REFERENCES HOSPITAL_BRANCHES(ID)
);
```

### Related Tables
- **ADMIN** - Must have matching ADMIN_ID
- **DEPARTMENTS** - If deptId provided, must exist
- **HOSPITAL_BRANCHES** - If branchId provided, must exist

---

## How to Fix the Error

### Option 1: Leave Fields Empty
When adding a technician, leave Department ID and Branch ID fields **EMPTY** (don't enter 0 or any number).

### Option 2: Use Valid IDs
Run this SQL to see valid IDs:

```sql
-- Check available branches
SELECT ID, NAME FROM HOSPITAL_BRANCHES ORDER BY ID;

-- Check available departments  
SELECT ID, NAME FROM DEPARTMENTS ORDER BY ID;
```

Then use those IDs in the form.

### Option 3: Create Branches/Departments First
Go to Admin Dashboard and create:
1. Hospital Branches first
2. Departments first
3. Then add Medical Technicians with those IDs

---

## Testing Flow

1. **Login as Admin** (adam@gmail.com)
2. **Go to Admin Dashboard** → Medical Technician
3. **Click "+ Add New"**
4. **Fill form:**
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "01234567890"
   - Degrees: "BSc" (optional)
   - Experience Years: 5 (optional)
   - Department ID: **LEAVE EMPTY**
   - Branch ID: **LEAVE EMPTY**
5. **Click "Save Technician"**
6. **Should see:** "✅ Added successfully!"

---

## Current Admin Users
```
USER_ID  EMAIL                      ADMIN_ID
74       jerin@gmail.com            3
103      adam@gmail.com             5  ← You're using this
62       admin@gmail.com            1
75       labiba@gmail.com           4
108      admin10@gmail.com          21
61       safatasnim405@gmail.com    (no ADMIN_ID shown)
```

---

## Files Summary

**Frontend:**
- `frontend/src/pages/AdminDashboard.jsx` - Form and submission logic

**Backend:**
- `backend/routes/adminRoutes.js` - Route registration
- `backend/controllers/medicalTechnicianController.js` - Business logic
- `backend/middleware/auth.js` - Authentication middleware

**Database:**
- `MEDICAL_TECHNICIAN` table
- `ADMIN` table
- `DEPARTMENTS` table (optional FK)
- `HOSPITAL_BRANCHES` table (optional FK)
