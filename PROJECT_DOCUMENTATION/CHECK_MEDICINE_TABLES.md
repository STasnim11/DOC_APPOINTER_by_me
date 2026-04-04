# Medicine Tables - Which One to Use?

## You Have TWO Medicine Tables

### 1. `medicines` (lowercase) - Admin Inventory
```sql
DESC medicines;
```
Columns:
- id
- name
- description
- manufacturer
- price
- stock_quantity
- expiry_date
- category
- created_at
- updated_at

**Used by:** Admin Medicine Management (`/api/admin/medicines`)

### 2. `MEDICATIONS` (uppercase) - Prescription Master
```sql
DESC MEDICATIONS;
```
Columns:
- ID
- MEDICINE_NAME
- DURATION
- DOSAGE
- CONTRAINDICATION

**Currently used by:** Nothing (was intended for prescriptions)

---

## Which Table Should Prescriptions Use?

### ✅ RECOMMENDED: Use `medicines` table

**Reasons:**
1. Single source of truth - one medicine list for entire system
2. Already managed by admin panel
3. Has complete medicine information
4. Can track stock levels
5. Has pricing information
6. Easier to maintain

**Changes needed:**
- ✅ Already done! Prescription controller now uses `medicines` table
- Prescription looks up medicine by `name` field
- Joins with `medicines` table to get medicine details

### ❌ Alternative: Use `MEDICATIONS` table

**Reasons to use:**
- If you want separate prescription medicine list
- If `MEDICATIONS` already has data you need
- If you want default dosage/duration per medicine

**Changes needed:**
- Revert prescription controller to use `MEDICATIONS`
- Populate `MEDICATIONS` table with medicine data
- Maintain two separate medicine lists

---

## Current Implementation

The prescription system NOW uses the **`medicines`** table:

```javascript
// Look up medicine by name
SELECT id FROM medicines WHERE UPPER(name) = UPPER(:medicineName)

// Get prescribed medicines
SELECT m.id, m.name, pm.DOSAGE, pm.DURATION, m.manufacturer, m.category
FROM PRESCRIBED_MED pm
JOIN medicines m ON pm.MEDICATION_ID = m.id
WHERE pm.PRESCRIPTION_ID = :prescriptionId
```

---

## What About MEDICATIONS Table?

### Option 1: Keep it for future use
- Maybe for drug interaction checking
- Maybe for default dosage suggestions
- Maybe for contraindication warnings

### Option 2: Drop it (not needed)
```sql
DROP TABLE MEDICATIONS;
```

### Option 3: Sync it with medicines table
Create a trigger to keep both in sync:
```sql
CREATE OR REPLACE TRIGGER sync_medications
AFTER INSERT OR UPDATE ON medicines
FOR EACH ROW
BEGIN
  MERGE INTO MEDICATIONS m
  USING (SELECT :NEW.id as id, :NEW.name as name FROM dual) src
  ON (m.ID = src.id)
  WHEN MATCHED THEN
    UPDATE SET m.MEDICINE_NAME = src.name
  WHEN NOT MATCHED THEN
    INSERT (ID, MEDICINE_NAME) VALUES (src.id, src.name);
END;
```

---

## Testing Current Implementation

### 1. Check if medicines table has data
```sql
SELECT COUNT(*) FROM medicines;
SELECT id, name FROM medicines WHERE ROWNUM <= 5;
```

### 2. Test prescription creation
```bash
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "diagnosis": "Test",
    "medicines": [
      {
        "medicineName": "Paracetamol 500mg",
        "dosage": "1 tablet twice daily",
        "duration": "5 days"
      }
    ]
  }'
```

### 3. Check if medicine name exists
```sql
SELECT id, name FROM medicines WHERE UPPER(name) = UPPER('Paracetamol 500mg');
```

---

## Recommendation

**Use `medicines` table** (already implemented) because:
1. ✅ Single source of truth
2. ✅ Already has admin management UI
3. ✅ Complete medicine information
4. ✅ Easier to maintain
5. ✅ Better for inventory tracking

**What to do with `MEDICATIONS` table:**
- Keep it for now (no harm)
- Maybe use it later for drug database/contraindications
- Or drop it if not needed

---

## If You Want to Use MEDICATIONS Instead

Let me know and I'll:
1. Revert the prescription controller
2. Update to use `MEDICATIONS` table
3. Create a sync script to populate `MEDICATIONS` from `medicines`

---

## Summary

✅ **Current Status:** Prescriptions use `medicines` table  
✅ **Medicine Lookup:** By `name` field (case-insensitive)  
✅ **Admin Management:** Works with `medicines` table  
✅ **Recommendation:** Keep current implementation  

**Next Steps:**
1. Add some medicines via admin panel (`/api/admin/medicines`)
2. Test prescription creation with those medicine names
3. Decide what to do with `MEDICATIONS` table (keep/drop/sync)
