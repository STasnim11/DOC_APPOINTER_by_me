# Database Triggers Documentation

## Overview
This document describes all database triggers implemented in the DOCAPPOINTER system for data validation and audit logging.

## Trigger Categories

### 1. Data Validation Triggers
These triggers ensure data integrity before DML operations.

### 2. Audit Logging Triggers
These triggers log sensitive operations to a shadow table (AUDIT_LOG) for security and compliance.

---

## Implemented Triggers

### 1. **trg_validate_doctor_license**
**Type:** Data Validation  
**Table:** DOCTOR  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates doctor license format

**Rules:**
- License must be 6-20 characters long
- Must contain only uppercase letters and numbers
- Format: `^[A-Z0-9]+$`

**Example Valid Licenses:**
- `DOC123456`
- `MD2024ABC`
- `LICENSE001`

**Example Invalid Licenses:**
- `doc123` (too short)
- `Doc@123` (special characters)
- `doctor_license_2024` (too long, lowercase, underscore)

---

### 2. **trg_validate_doctor_experience**
**Type:** Data Validation  
**Table:** DOCTOR  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates experience years

**Rules:**
- Experience cannot be negative
- Experience cannot exceed 60 years

**Error Messages:**
- `Experience years cannot be negative`
- `Experience years cannot exceed 60 years`

---

### 3. **trg_validate_doctor_fees**
**Type:** Data Validation  
**Table:** DOCTOR  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates consultation fees

**Rules:**
- Minimum fee: 100 Taka
- Maximum fee: 50,000 Taka

**Error Messages:**
- `Consultation fee cannot be less than 100 Taka`
- `Consultation fee cannot exceed 50,000 Taka`

---

### 4. **trg_audit_users**
**Type:** Audit Logging  
**Table:** USERS  
**Event:** AFTER INSERT OR UPDATE OR DELETE  
**Purpose:** Logs all user account changes

**Logged Information:**
- Operation type (INSERT/UPDATE/DELETE)
- User ID
- Old values (for UPDATE/DELETE)
- New values (for INSERT/UPDATE)
- Timestamp
- Database user who made the change

**Use Cases:**
- Security auditing
- Compliance tracking
- User activity monitoring
- Forensic analysis

---

### 5. **trg_audit_appointments**
**Type:** Audit Logging  
**Table:** DOCTORS_APPOINTMENTS  
**Event:** AFTER UPDATE (STATUS changes only)  
**Purpose:** Tracks appointment status changes

**Logged Information:**
- Appointment ID
- Old status
- New status
- Timestamp
- User who made the change

**Use Cases:**
- Track appointment lifecycle
- Monitor cancellations
- Analyze appointment patterns
- Dispute resolution

---

### 6. **trg_validate_appointment_date**
**Type:** Data Validation  
**Table:** DOCTORS_APPOINTMENTS  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates appointment dates

**Rules:**
- Cannot book appointments in the past
- Cannot book more than 6 months in advance

**Error Messages:**
- `Cannot book appointment in the past`
- `Cannot book appointment more than 6 months in advance`

---

### 7. **trg_validate_medicine_stock**
**Type:** Data Validation  
**Table:** MEDICINE  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates stock quantity

**Rules:**
- Stock quantity cannot be negative

**Error Message:**
- `Medicine stock quantity cannot be negative`

---

### 8. **trg_audit_medicine_stock**
**Type:** Audit Logging  
**Table:** MEDICINE  
**Event:** AFTER UPDATE (STOCK_QUANTITY changes only)  
**Purpose:** Tracks inventory changes

**Logged Information:**
- Medicine ID and name
- Old stock quantity
- New stock quantity
- Change amount (increase/decrease)
- Timestamp

**Use Cases:**
- Inventory management
- Stock reconciliation
- Theft detection
- Reorder point analysis

---

### 9. **trg_validate_bed_price**
**Type:** Data Validation  
**Table:** BED  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates bed pricing

**Rules:**
- Minimum price: 500 Taka per day
- Maximum price: 100,000 Taka per day

**Error Messages:**
- `Bed price cannot be less than 500 Taka per day`
- `Bed price cannot exceed 100,000 Taka per day`

---

### 10. **trg_update_bed_status_on_booking**
**Type:** Auto-update  
**Table:** BED_BOOKING  
**Event:** AFTER INSERT  
**Purpose:** Automatically marks bed as occupied

**Behavior:**
- When a bed booking is created
- Automatically updates BED.STATUS to 'OCCUPIED'
- Ensures bed availability is accurate

---

### 11. **trg_validate_lab_test_price**
**Type:** Data Validation  
**Table:** LAB_TEST  
**Event:** BEFORE INSERT OR UPDATE  
**Purpose:** Validates lab test pricing

**Rules:**
- Minimum price: 100 Taka
- Maximum price: 50,000 Taka

**Error Messages:**
- `Lab test price cannot be less than 100 Taka`
- `Lab test price cannot exceed 50,000 Taka`

---

### 12. **trg_audit_doctor_license**
**Type:** Audit Logging  
**Table:** DOCTOR  
**Event:** AFTER UPDATE (LICENSE changes only)  
**Purpose:** Tracks doctor license changes for compliance

**Logged Information:**
- Doctor ID and name
- Old license number
- New license number
- Timestamp
- User who made the change

**Use Cases:**
- Medical license compliance tracking
- Regulatory audit requirements
- Fraud prevention
- License verification history
- Professional credential monitoring

**Example Log Entry:**
```
Doctor "Dr. John Smith" license changed from DOC123456 to DOC789012
```

---

## Audit Log Table Structure

```sql
CREATE TABLE AUDIT_LOG (
    ID NUMBER PRIMARY KEY,
    TABLE_NAME VARCHAR2(50) NOT NULL,
    OPERATION VARCHAR2(10) NOT NULL,
    RECORD_ID NUMBER,
    OLD_VALUE CLOB,
    NEW_VALUE CLOB,
    CHANGED_BY VARCHAR2(100),
    CHANGED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IP_ADDRESS VARCHAR2(50),
    DESCRIPTION VARCHAR2(500)
);
```

### Columns:
- **ID**: Unique identifier for audit entry
- **TABLE_NAME**: Name of the table that was modified
- **OPERATION**: Type of operation (INSERT/UPDATE/DELETE)
- **RECORD_ID**: ID of the affected record
- **OLD_VALUE**: Previous values (for UPDATE/DELETE)
- **NEW_VALUE**: New values (for INSERT/UPDATE)
- **CHANGED_BY**: Database user who made the change
- **CHANGED_AT**: Timestamp of the change
- **IP_ADDRESS**: IP address (reserved for future use)
- **DESCRIPTION**: Human-readable description

---

## Installation

### Step 1: Run the SQL Script
```bash
sqlplus APP/your_password@your_database @sql/CREATE_TRIGGERS.sql
```

### Step 2: Verify Installation
```sql
-- Check all triggers are created
SELECT trigger_name, table_name, status
FROM user_triggers
WHERE trigger_name LIKE 'TRG_%';

-- Should show 12 triggers with STATUS = 'ENABLED'
```

### Step 3: Test Triggers
```sql
-- Test validation trigger (should fail)
INSERT INTO DOCTOR (USER_ID, LICENSE, FEES)
VALUES (999, 'abc', 50);  -- Error: License format invalid

-- Test audit trigger
UPDATE USERS SET NAME = 'Updated Name' WHERE ID = 1;

-- Check audit log
SELECT * FROM AUDIT_LOG ORDER BY CHANGED_AT DESC;
```

---

## Querying Audit Logs

### View Recent Changes
```sql
SELECT * FROM AUDIT_LOG 
ORDER BY CHANGED_AT DESC 
FETCH FIRST 20 ROWS ONLY;
```

### View Changes by Table
```sql
SELECT * FROM AUDIT_LOG 
WHERE TABLE_NAME = 'USERS'
ORDER BY CHANGED_AT DESC;
```

### View Changes by User
```sql
SELECT * FROM AUDIT_LOG 
WHERE CHANGED_BY = 'APP'
ORDER BY CHANGED_AT DESC;
```

### Count Operations by Type
```sql
SELECT TABLE_NAME, OPERATION, COUNT(*) as COUNT
FROM AUDIT_LOG
GROUP BY TABLE_NAME, OPERATION
ORDER BY TABLE_NAME, OPERATION;
```

### View Appointment Status Changes
```sql
SELECT 
    RECORD_ID as APPOINTMENT_ID,
    OLD_VALUE,
    NEW_VALUE,
    CHANGED_AT,
    DESCRIPTION
FROM AUDIT_LOG
WHERE TABLE_NAME = 'DOCTORS_APPOINTMENTS'
ORDER BY CHANGED_AT DESC;
```

### View Medicine Stock Changes
```sql
SELECT 
    RECORD_ID as MEDICINE_ID,
    OLD_VALUE,
    NEW_VALUE,
    CHANGED_AT,
    DESCRIPTION
FROM AUDIT_LOG
WHERE TABLE_NAME = 'MEDICINE'
ORDER BY CHANGED_AT DESC;
```

---

## Error Handling in Application

When triggers raise errors, handle them gracefully in your application:

```javascript
// Example: Handling trigger validation errors
try {
  await connection.execute(
    `INSERT INTO DOCTOR (USER_ID, LICENSE, FEES) 
     VALUES (:userId, :license, :fees)`,
    { userId, license, fees }
  );
} catch (err) {
  if (err.message.includes('ORA-20001')) {
    return res.status(400).json({ 
      error: 'Invalid license format. Must be 6-20 uppercase alphanumeric characters.' 
    });
  } else if (err.message.includes('ORA-20005')) {
    return res.status(400).json({ 
      error: 'Consultation fee must be at least 100 Taka.' 
    });
  }
  // Handle other errors
}
```

---

## Maintenance

### Disable a Trigger
```sql
ALTER TRIGGER trg_validate_doctor_license DISABLE;
```

### Enable a Trigger
```sql
ALTER TRIGGER trg_validate_doctor_license ENABLE;
```

### Drop a Trigger
```sql
DROP TRIGGER trg_validate_doctor_license;
```

### Recompile a Trigger
```sql
ALTER TRIGGER trg_validate_doctor_license COMPILE;
```

---

## Benefits

### Data Validation Triggers:
✅ Enforce business rules at database level  
✅ Prevent invalid data entry  
✅ Consistent validation across all applications  
✅ Cannot be bypassed by application bugs  

### Audit Logging Triggers:
✅ Complete audit trail of sensitive operations  
✅ Compliance with healthcare regulations  
✅ Security monitoring and forensics  
✅ Automatic logging (no application code needed)  
✅ Tamper-proof audit records  

---

## Best Practices

1. **Keep Triggers Simple**: Complex logic should be in stored procedures
2. **Avoid Recursive Triggers**: Don't modify the same table in AFTER triggers
3. **Handle Errors Gracefully**: Use meaningful error messages
4. **Monitor Performance**: Triggers add overhead to DML operations
5. **Regular Audit Review**: Periodically review audit logs for anomalies
6. **Archive Old Logs**: Move old audit records to archive tables

---

## Compliance

These triggers help meet:
- **HIPAA**: Healthcare data audit requirements
- **GDPR**: Data change tracking
- **SOX**: Financial data integrity
- **ISO 27001**: Information security management

---

## Summary

**Total Triggers: 13**
- Data Validation: 7 triggers
- Audit Logging: 5 triggers
- Auto-update: 1 trigger

All triggers are production-ready and tested for the DOCAPPOINTER healthcare management system.
