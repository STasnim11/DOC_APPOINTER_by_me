# Prescription Management System

A complete backend API for managing medical prescriptions with medicines, dosages, and durations.

## 🚀 Quick Start

### 1. Database Migration (Required)
```sql
ALTER TABLE PRESCRIBED_MED ADD (
  DOSAGE VARCHAR2(100),
  DURATION VARCHAR2(100)
);
```

### 2. Start Server
```bash
cd backend
node server.js
```

### 3. Test API
```bash
curl http://localhost:3000/api/prescriptions/medicines
```

## 📚 Documentation

- **[API Documentation](PRESCRIPTION_API.md)** - Complete API reference
- **[Frontend Guide](FRONTEND_INTEGRATION_GUIDE.md)** - Integration examples
- **[Testing Guide](test_prescription_api.md)** - How to test endpoints
- **[Deployment Checklist](PRESCRIPTION_DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[Implementation Summary](PRESCRIPTION_IMPLEMENTATION_SUMMARY.md)** - Technical overview

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/prescriptions/medicines` | Get all medicines |
| `POST` | `/api/prescriptions` | Create prescription |
| `GET` | `/api/prescriptions/appointment/:id` | Get by appointment |
| `GET` | `/api/prescriptions/:id` | Get by prescription ID |
| `PUT` | `/api/prescriptions/:id` | Update prescription |
| `DELETE` | `/api/prescriptions/:id` | Delete prescription |

## 💊 Example Usage

### Create Prescription
```javascript
const response = await fetch('http://localhost:3000/api/prescriptions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appointmentId: 123,
    diagnosis: "Viral Fever",
    instructions: "Take rest and drink plenty of water",
    medicines: [
      {
        medicineId: 1,
        dosage: "1 tablet twice daily",
        duration: "5 days"
      }
    ]
  })
});
```

### Get Prescription
```javascript
const response = await fetch(
  'http://localhost:3000/api/prescriptions/appointment/123'
);
const data = await response.json();
console.log(data.prescription);
```

## 🗂️ Database Schema

### PRESCRIPTION
- Stores prescription details (diagnosis, instructions, etc.)
- Links to DOCTORS_APPOINTMENTS

### PRESCRIBED_MED
- Junction table linking prescriptions to medicines
- Stores prescription-specific dosage and duration

### MEDICATIONS
- Master list of available medicines
- Stores medicine information and contraindications

## ✨ Features

- ✅ Create prescriptions with multiple medicines
- ✅ Custom dosage/duration per medicine per prescription
- ✅ Retrieve prescriptions by appointment or prescription ID
- ✅ Update existing prescriptions
- ✅ Delete prescriptions (cascade delete medicines)
- ✅ Get all available medicines for selection
- ✅ Transaction safety with automatic rollback
- ✅ Comprehensive validation
- ✅ Prevents duplicate prescriptions

## 🛡️ Validation

- Verifies appointment exists
- Prevents duplicate prescriptions per appointment
- Validates all medicine IDs
- Skips invalid medicines gracefully
- Ensures data consistency with transactions

## 📦 Files

### Controllers
- `controllers/prescriptionController.js` - Main business logic

### Routes
- `routes/prescriptionRoutes.js` - API route definitions

### Migrations
- `migrations/add_dosage_to_prescribed_med.sql` - Database schema update

### Documentation
- `PRESCRIPTION_API.md` - API reference
- `FRONTEND_INTEGRATION_GUIDE.md` - Frontend examples
- `test_prescription_api.md` - Testing guide
- `PRESCRIPTION_DEPLOYMENT_CHECKLIST.md` - Deployment steps
- `PRESCRIPTION_IMPLEMENTATION_SUMMARY.md` - Technical details

## 🔧 Configuration

Update `backend/db/connection.js` with your database credentials:
```javascript
const dbConfig = {
  user: "your_user",
  password: "your_password",
  connectString: "localhost:1521/FREEPDB1"
};
```

## 🧪 Testing

### Manual Testing
```bash
# Get medicines
curl http://localhost:3000/api/prescriptions/medicines

# Create prescription
curl -X POST http://localhost:3000/api/prescriptions \
  -H "Content-Type: application/json" \
  -d '{"appointmentId": 1, "diagnosis": "Test"}'

# Get prescription
curl http://localhost:3000/api/prescriptions/appointment/1
```

### Using Postman
Import the endpoints from `test_prescription_api.md`

## 🐛 Troubleshooting

### "BIND_OUT is not defined"
- Ensure database migration was run
- Restart the server after migration

### "Appointment not found"
- Verify appointment ID exists in DOCTORS_APPOINTMENTS table

### "Prescription already exists"
- Each appointment can only have one prescription
- Use GET endpoint to retrieve existing prescription

### "Medicine not found"
- Verify medicine IDs exist in MEDICATIONS table
- Use GET /medicines to see available medicines

## 📝 Response Format

### Success
```json
{
  "success": true,
  "message": "Prescription created successfully",
  "prescriptionId": 456
}
```

### Error
```json
{
  "success": false,
  "message": "Appointment not found"
}
```

## 🔐 Security Notes

- Implement authentication middleware before production
- Add role-based access control (doctors only)
- Validate user permissions for appointments
- Sanitize all user inputs
- Use prepared statements (already implemented)

## 🚧 Future Enhancements

- [ ] Prescription templates
- [ ] E-signature for doctors
- [ ] Prescription versioning/history
- [ ] Drug interaction checking
- [ ] PDF generation
- [ ] Email/SMS notifications
- [ ] Prescription analytics

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the troubleshooting section
3. Check server logs for detailed errors
4. Contact the backend team

## 📄 License

[Your License Here]

---

**Version:** 1.0.0  
**Last Updated:** April 2, 2026  
**Maintained by:** Backend Team
