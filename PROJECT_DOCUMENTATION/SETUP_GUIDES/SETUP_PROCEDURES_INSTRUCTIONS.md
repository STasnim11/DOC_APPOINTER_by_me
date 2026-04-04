# HOW TO FIX: Stored Procedures Not Found

## Problem
The error `PLS-00201: identifier 'SP_BOOK_APPOINTMENT' must be declared` means the stored procedure doesn't exist in your Oracle database yet.

## Solution: Run SQL Files to Create Procedures

### Step 1: Create the Stored Procedures

You need to run these SQL files in your Oracle database:

**File 1: `sql/database_features.sql`** - Contains all functions and procedures
**File 2: `sql/FIX_DATABASE_FUNCTIONS.sql`** - Contains fixes for your schema

### Step 2: How to Run SQL Files

#### Option A: Using SQL Developer / SQL*Plus
```sql
-- Connect to your database
-- Then run:
@sql/database_features.sql
@sql/FIX_DATABASE_FUNCTIONS.sql
```

#### Option B: Copy and Paste
1. Open `sql/database_features.sql`
2. Copy the entire content
3. Paste into your SQL client
4. Execute
5. Repeat for `sql/FIX_DATABASE_FUNCTIONS.sql`

### Step 3: Verify Procedures Exist

Run this query to check:
```sql
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type IN ('PROCEDURE', 'FUNCTION')
ORDER BY object_type, object_name;
```

You should see:
- fn_get_doctor_appointment_count (FUNCTION)
- fn_calculate_bed_occupancy (FUNCTION)
- fn_get_patient_total_expenses (FUNCTION)
- sp_book_appointment (PROCEDURE)
- sp_generate_bill (PROCEDURE)
- sp_update_medicine_stock (PROCEDURE)

### Step 4: Restart Backend Server

After creating procedures:
```bash
# Stop your backend server (Ctrl+C)
# Start it again
cd backend
node server.js
```

---

## Alternative: Revert to Old Code (Without Procedures)

If you don't want to use stored procedures right now, I can revert the appointment booking to the old manual SQL code.

Would you like me to:
1. Help you run the SQL files? (Recommended)
2. Revert to old code without procedures?
