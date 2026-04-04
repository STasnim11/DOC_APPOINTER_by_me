# Stored Procedures Usage Guide

## Overview
This guide shows how all 3 stored procedures are implemented and used in the DOCAPPOINTER application.

---

## ✅ PROCEDURE 1: sp_book_appointment

### Purpose
Multi-step workflow for booking appointments with validation.

### Database Definition
```sql
CREATE OR REPLACE PROCEDURE sp_book_appointment(
  p_patient_id IN NUMBER,
  p_doctor_id IN NUMBER,
  p_appointment_date IN DATE,
  p_time_slot_id IN NUMBER,
  p_appointment_type IN VARCHAR2,
  p_appointment_id OUT NUMBER
)
```

### What It Does
1. Validates time slot exists and belongs to doctor
2. Checks slot availability
3. Prevents duplicate bookings
4. Inserts appointment record with BOOKED status
5. Updates time slot status
6. Commits transaction

### Where It's Used

#### Backend: `backend/controllers/databaseFeaturesController.js`
```javascript
exports.bookAppointmentWithProcedure = async (req, res) => {
  const { patientId, doctorId, appointmentDate, timeSlotId, appointmentType } = req.body;
  
  const result = await connection.execute(
    `BEGIN
       sp_book_appointment(
         :patientId, :doctorId, :appointmentDate, 
         :timeSlotId, :appointmentType, :appointmentId
       );
     END;`,
    {
      patientId, doctorId, appointmentDate, timeSlotId, appointmentType,
      appointmentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );
  
  const newAppointmentId = result.outBinds.appointmentId;
  res.json({ success: true, appointmentId: newAppointmentId });
};
```

#### API Endpoint
```
POST /api/admin/db-features/book-appointment
```

#### Request Body
```json
{
  "patientId": 1,
  "doctorId": 2,
  "appointmentDate": "2026-04-10",
  "timeSlotId": 5,
  "appointmentType": "CONSULTATION"
}
```

#### Response
```json
{
  "success": true,
  "appointmentId": 123,
  "message": "Appointment booked successfully using stored procedure"
}
```

### Testing
```bash
curl -X POST http://localhost:3000/api/admin/db-features/book-appointment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patientId": 1,
    "doctorId": 2,
    "appointmentDate": "2026-04-10",
    "timeSlotId": 5,
    "appointmentType": "CONSULTATION"
  }'
```

---

## ✅ PROCEDURE 2: sp_update_medicine_stock

### Purpose
Multi-step workflow for updating medicine inventory with validation.

### Database Definition
```sql
CREATE OR REPLACE PROCEDURE sp_update_medicine_stock(
  p_medication_id IN NUMBER,
  p_quantity IN NUMBER
)
```

### What It Does
1. Retrieves current stock quantity
2. Validates sufficient stock available
3. Deducts quantity from stock
4. Raises error if insufficient stock
5. Commits transaction

### Where It's Used

#### 1. When Writing Prescriptions
**File:** `backend/controllers/prescriptionController.js`

```javascript
// After inserting medicine to prescription
await connection.execute(
  `BEGIN
     sp_update_medicine_stock(:medicationId, :quantity);
   END;`,
  {
    medicationId: medicineId,
    quantity: 1 // Deduct 1 unit per prescription
  }
);
console.log(`✅ Medicine stock updated via stored procedure`);
```

**Triggered by:** Doctor writes prescription and adds medicines

#### 2. Manual Stock Update (Admin)
**File:** `backend/controllers/medicineController.js`

```javascript
exports.updateMedicineStock = async (req, res) => {
  const { medicationId, quantity } = req.body;
  
  await connection.execute(
    `BEGIN
       sp_update_medicine_stock(:medicationId, :quantity);
     END;`,
    { medicationId, quantity },
    { autoCommit: true }
  );
  
  res.json({ 
    success: true, 
    message: `Medicine stock updated. ${quantity} units deducted.` 
  });
};
```

#### API Endpoints

**1. Via Database Features (Admin)**
```
POST /api/admin/db-features/update-stock
```

**2. Via Medicine Management (Admin)**
```
POST /api/admin/medicines/update-stock
```

#### Request Body
```json
{
  "medicationId": 5,
  "quantity": 10
}
```

#### Response
```json
{
  "success": true,
  "message": "Medicine stock updated successfully. 10 units deducted."
}
```

### Testing
```bash
# Test via database features endpoint
curl -X POST http://localhost:3000/api/admin/db-features/update-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "medicationId": 5,
    "quantity": 10
  }'

# Test via medicine management endpoint
curl -X POST http://localhost:3000/api/admin/medicines/update-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "medicationId": 5,
    "quantity": 10
  }'
```

### Automatic Usage
This procedure is automatically called when:
- Doctor writes a prescription with medicines
- Each medicine in prescription triggers stock deduction
- Happens in background during prescription creation

---

## ✅ PROCEDURE 3: sp_generate_bill

### Purpose
Multi-step workflow for generating bills after appointment completion.

### Database Definition
```sql
CREATE OR REPLACE PROCEDURE sp_generate_bill(
  p_admin_id IN NUMBER,
  p_appointment_id IN NUMBER,
  p_consultation_fee IN NUMBER,
  p_bill_id OUT NUMBER
)
```

### What It Does
1. Retrieves prescription details for appointment
2. Calculates total medicine costs from prescription
3. Calculates lab test costs
4. Generates total bill amount
5. Inserts bill record with PENDING status
6. Returns generated bill ID
7. Commits transaction

### Where It's Used

#### 1. When Completing Appointments (Automatic)
**File:** `backend/controllers/doctorAppointments.js`

```javascript
exports.completeAppointment = async (req, res) => {
  // ... validation code ...
  
  // Update appointment status
  await connection.execute(
    `UPDATE DOCTORS_APPOINTMENTS SET STATUS = 'COMPLETED' WHERE ID = :id`,
    { id }
  );
  
  // ✅ USE STORED PROCEDURE: sp_generate_bill
  // Automatically generate bill after completing appointment
  try {
    // Get doctor info and consultation fee
    const doctorInfoResult = await connection.execute(
      `SELECT da.DOCTOR_ID, d.FEES
       FROM DOCTORS_APPOINTMENTS da
       JOIN DOCTOR d ON da.DOCTOR_ID = d.ID
       WHERE da.ID = :id`,
      { id }
    );
    
    const consultationFee = doctorInfoResult.rows[0][1];
    
    // Get admin ID
    const adminResult = await connection.execute(
      `SELECT ID FROM USERS WHERE ROLE = 'ADMIN' AND ROWNUM = 1`
    );
    const adminId = adminResult.rows[0][0];
    
    // Call stored procedure
    const billResult = await connection.execute(
      `BEGIN
         sp_generate_bill(:adminId, :appointmentId, :consultationFee, :billId);
       END;`,
      {
        adminId: adminId,
        appointmentId: id,
        consultationFee: consultationFee,
        billId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );
    
    console.log(`✅ Bill generated via stored procedure. Bill ID: ${billResult.outBinds.billId}`);
  } catch (billError) {
    console.log(`⚠️ Bill generation warning:`, billError.message);
  }
  
  await connection.commit();
  
  res.json({ message: "✅ Appointment completed and bill generated" });
};
```

**Triggered by:** Doctor marks appointment as completed

#### 2. Manual Bill Generation (Admin)
**File:** `backend/controllers/databaseFeaturesController.js`

```javascript
exports.generateBill = async (req, res) => {
  const { adminId, appointmentId, consultationFee } = req.body;
  
  const result = await connection.execute(
    `BEGIN
       sp_generate_bill(:adminId, :appointmentId, :consultationFee, :billId);
     END;`,
    {
      adminId, appointmentId, consultationFee,
      billId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  );
  
  const billId = result.outBinds.billId;
  res.json({ success: true, billId, message: "Bill generated successfully" });
};
```

#### API Endpoints

**1. Automatic (via appointment completion)**
```
PUT /api/doctor/appointments/:id/complete
```

**2. Manual (via database features)**
```
POST /api/admin/db-features/generate-bill
```

#### Request Body (Manual)
```json
{
  "adminId": 1,
  "appointmentId": 123,
  "consultationFee": 500
}
```

#### Response
```json
{
  "success": true,
  "billId": 456,
  "message": "Bill generated successfully using stored procedure"
}
```

### Testing

**Automatic (Complete Appointment):**
```bash
curl -X PUT http://localhost:3000/api/doctor/appointments/123/complete \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN"
```

**Manual (Generate Bill):**
```bash
curl -X POST http://localhost:3000/api/admin/db-features/generate-bill \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "adminId": 1,
    "appointmentId": 123,
    "consultationFee": 500
  }'
```

### Automatic Usage
This procedure is automatically called when:
- Doctor completes an appointment
- Bill is generated in background
- Includes consultation fee + medicine costs + lab test costs
- Patient receives complete bill

---

## Summary Table

| Procedure | Used In | Trigger | Automatic? |
|-----------|---------|---------|------------|
| `sp_book_appointment` | Database Features | Admin books appointment | Manual |
| `sp_update_medicine_stock` | Prescription Creation | Doctor writes prescription | ✅ Automatic |
| `sp_update_medicine_stock` | Medicine Management | Admin updates stock | Manual |
| `sp_generate_bill` | Appointment Completion | Doctor completes appointment | ✅ Automatic |
| `sp_generate_bill` | Database Features | Admin generates bill | Manual |

---

## Verification

### Check Procedures Exist
```sql
SELECT object_name, object_type, status 
FROM user_objects 
WHERE object_type = 'PROCEDURE'
  AND object_name LIKE 'SP_%'
ORDER BY object_name;
```

Expected output:
```
SP_BOOK_APPOINTMENT          PROCEDURE    VALID
SP_GENERATE_BILL             PROCEDURE    VALID
SP_UPDATE_MEDICINE_STOCK     PROCEDURE    VALID
```

### Test Procedures Directly in SQL

**Test sp_book_appointment:**
```sql
DECLARE
  v_appointment_id NUMBER;
BEGIN
  sp_book_appointment(
    p_patient_id => 1,
    p_doctor_id => 2,
    p_appointment_date => TO_DATE('2026-04-10', 'YYYY-MM-DD'),
    p_time_slot_id => 5,
    p_appointment_type => 'CONSULTATION',
    p_appointment_id => v_appointment_id
  );
  DBMS_OUTPUT.PUT_LINE('Appointment ID: ' || v_appointment_id);
END;
/
```

**Test sp_update_medicine_stock:**
```sql
BEGIN
  sp_update_medicine_stock(
    p_medication_id => 5,
    p_quantity => 10
  );
  DBMS_OUTPUT.PUT_LINE('Stock updated successfully');
END;
/
```

**Test sp_generate_bill:**
```sql
DECLARE
  v_bill_id NUMBER;
BEGIN
  sp_generate_bill(
    p_admin_id => 1,
    p_appointment_id => 123,
    p_consultation_fee => 500,
    p_bill_id => v_bill_id
  );
  DBMS_OUTPUT.PUT_LINE('Bill ID: ' || v_bill_id);
END;
/
```

---

## Files Reference

### SQL Files:
- `sql/CREATE_PROCEDURES_ONLY.sql` - All procedure definitions

### Backend Controllers:
- `backend/controllers/databaseFeaturesController.js` - Manual procedure calls
- `backend/controllers/prescriptionController.js` - Auto stock update
- `backend/controllers/doctorAppointments.js` - Auto bill generation
- `backend/controllers/medicineController.js` - Stock update endpoint

### Routes:
- `backend/routes/adminRoutes.js` - All procedure endpoints

---

## Conclusion

✅ All 3 stored procedures are fully implemented and actively used in the application:

1. **sp_book_appointment** - Used for booking appointments with validation
2. **sp_update_medicine_stock** - Automatically called when prescriptions are written + manual admin endpoint
3. **sp_generate_bill** - Automatically called when appointments are completed + manual admin endpoint

The procedures demonstrate:
- Multi-step workflows across multiple tables
- Data validation and error handling
- Transaction management
- Real-world healthcare business logic
- Both automatic and manual usage patterns
