// ============================================
// DEAD CODE - ALL FUNCTIONS IN THIS FILE ARE UNUSED
// ============================================
// These 5 complex query functions are NOT called from the frontend
// The frontend uses /db-features/stats instead (which uses SQL functions)
// These routes are commented out in adminRoutes.js
// This file can be kept for future use or deleted
// ============================================

const connectDB = require('../db/connection');

// Complex Query 1: Department-wise doctor and technician statistics
exports.getDepartmentStatistics = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT 
         d.ID,
         d.NAME as DEPARTMENT_NAME,
         COUNT(DISTINCT doc.ID) as TOTAL_DOCTORS,
         COUNT(DISTINCT mt.ID) as TOTAL_TECHNICIANS,
         ROUND(AVG(doc.EXPERIENCE_YEARS), 2) as AVG_DOCTOR_EXPERIENCE,
         ROUND(AVG(mt.EXPERIENCE_YEARS), 2) as AVG_TECH_EXPERIENCE,
         COUNT(DISTINCT da.ID) as TOTAL_APPOINTMENTS
       FROM DEPARTMENTS d
       LEFT JOIN DOCTOR doc ON d.ID = doc.DEPT_ID
       LEFT JOIN MEDICAL_TECHNICIAN mt ON d.ID = mt.DEPT_ID
       LEFT JOIN DOCTORS_APPOINTMENTS da ON doc.ID = da.DOCTOR_ID
       GROUP BY d.ID, d.NAME
       ORDER BY TOTAL_APPOINTMENTS DESC`
    );

    const statistics = result.rows.map(row => ({
      departmentId: row[0],
      departmentName: row[1],
      totalDoctors: row[2],
      totalTechnicians: row[3],
      avgDoctorExperience: row[4],
      avgTechExperience: row[5],
      totalAppointments: row[6]
    }));

    res.status(200).json({ statistics });
  } catch (err) {
    console.error('Error fetching department statistics:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  } finally {
    if (connection) await connection.close();
  }
};

// Complex Query 2: Branch-wise resource allocation and utilization
exports.getBranchResourceAllocation = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT 
         hb.ID,
         hb.NAME as BRANCH_NAME,
         hb.ADDRESS,
         COUNT(DISTINCT doc.ID) as TOTAL_DOCTORS,
         COUNT(DISTINCT mt.ID) as TOTAL_TECHNICIANS,
         COUNT(DISTINCT b.ID) as TOTAL_BEDS,
         SUM(CASE WHEN b.STATUS = 'occupied' THEN 1 ELSE 0 END) as OCCUPIED_BEDS,
         ROUND(
           (SUM(CASE WHEN b.STATUS = 'occupied' THEN 1 ELSE 0 END) * 100.0) / 
           NULLIF(COUNT(DISTINCT b.ID), 0), 2
         ) as BED_OCCUPANCY_RATE,
         COUNT(DISTINCT bc.ID) as TOTAL_CONTACTS
       FROM HOSPITAL_BRANCHES hb
       LEFT JOIN DOCTOR doc ON hb.ID = doc.BRANCH_ID
       LEFT JOIN MEDICAL_TECHNICIAN mt ON hb.ID = mt.BRANCH_ID
       LEFT JOIN BEDS b ON hb.ID = b.ADMIN_ID
       LEFT JOIN BRANCH_CONTACTS bc ON hb.ID = bc.BRANCH_ID
       GROUP BY hb.ID, hb.NAME, hb.ADDRESS
       ORDER BY TOTAL_DOCTORS DESC`
    );

    const allocation = result.rows.map(row => ({
      branchId: row[0],
      branchName: row[1],
      address: row[2],
      totalDoctors: row[3],
      totalTechnicians: row[4],
      totalBeds: row[5],
      occupiedBeds: row[6],
      bedOccupancyRate: row[7],
      totalContacts: row[8]
    }));

    res.status(200).json({ allocation });
  } catch (err) {
    console.error('Error fetching branch allocation:', err);
    res.status(500).json({ error: 'Failed to fetch allocation data' });
  } finally {
    if (connection) await connection.close();
  }
};

// Complex Query 3: Top doctors by appointment count and prescription activity
exports.getTopDoctors = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT 
         doc.ID,
         u.NAME as DOCTOR_NAME,
         u.EMAIL,
         doc.LICENSE_NUMBER,
         doc.EXPERIENCE_YEARS,
         d.NAME as DEPARTMENT_NAME,
         hb.NAME as BRANCH_NAME,
         COUNT(DISTINCT da.ID) as TOTAL_APPOINTMENTS,
         COUNT(DISTINCT p.ID) as TOTAL_PRESCRIPTIONS,
         COUNT(DISTINCT pm.ID) as TOTAL_MEDICINES_PRESCRIBED,
         ROUND(COUNT(DISTINCT pm.ID) * 1.0 / NULLIF(COUNT(DISTINCT p.ID), 0), 2) as AVG_MEDICINES_PER_PRESCRIPTION
       FROM DOCTOR doc
       INNER JOIN USERS u ON doc.USER_ID = u.ID
       LEFT JOIN DEPARTMENTS d ON doc.DEPT_ID = d.ID
       LEFT JOIN HOSPITAL_BRANCHES hb ON doc.BRANCH_ID = hb.ID
       LEFT JOIN DOCTORS_APPOINTMENTS da ON doc.ID = da.DOCTOR_ID
       LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
       LEFT JOIN PRESCRIBED_MED pm ON p.ID = pm.PRESCRIPTION_ID
       GROUP BY doc.ID, u.NAME, u.EMAIL, doc.LICENSE_NUMBER, 
                doc.EXPERIENCE_YEARS, d.NAME, hb.NAME
       HAVING COUNT(DISTINCT da.ID) > 0
       ORDER BY TOTAL_APPOINTMENTS DESC, TOTAL_PRESCRIPTIONS DESC
       FETCH FIRST 10 ROWS ONLY`
    );

    const topDoctors = result.rows.map(row => ({
      doctorId: row[0],
      doctorName: row[1],
      email: row[2],
      licenseNumber: row[3],
      experienceYears: row[4],
      departmentName: row[5],
      branchName: row[6],
      totalAppointments: row[7],
      totalPrescriptions: row[8],
      totalMedicinesPrescribed: row[9],
      avgMedicinesPerPrescription: row[10]
    }));

    res.status(200).json({ topDoctors });
  } catch (err) {
    console.error('Error fetching top doctors:', err);
    res.status(500).json({ error: 'Failed to fetch top doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Complex Query 4: Medicine usage and stock analysis
exports.getMedicineUsageAnalysis = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT 
         m.ID,
         m.NAME as MEDICINE_NAME,
         m.CATEGORY,
         m.MANUFACTURER,
         m.STOCK_QUANTITY,
         m.PRICE,
         COUNT(DISTINCT pm.ID) as TIMES_PRESCRIBED,
         COUNT(DISTINCT pm.PRESCRIPTION_ID) as UNIQUE_PRESCRIPTIONS,
         COUNT(DISTINCT p.APPOINTMENT_ID) as UNIQUE_APPOINTMENTS,
         ROUND(m.PRICE * COUNT(DISTINCT pm.ID), 2) as TOTAL_VALUE_PRESCRIBED,
         CASE 
           WHEN m.STOCK_QUANTITY < 10 THEN 'Critical'
           WHEN m.STOCK_QUANTITY < 50 THEN 'Low'
           WHEN m.STOCK_QUANTITY < 100 THEN 'Medium'
           ELSE 'Adequate'
         END as STOCK_STATUS
       FROM MEDICINES m
       LEFT JOIN PRESCRIBED_MED pm ON m.ID = pm.MEDICATION_ID
       LEFT JOIN PRESCRIPTION p ON pm.PRESCRIPTION_ID = p.ID
       GROUP BY m.ID, m.NAME, m.CATEGORY, m.MANUFACTURER, 
                m.STOCK_QUANTITY, m.PRICE
       ORDER BY TIMES_PRESCRIBED DESC, STOCK_QUANTITY ASC`
    );

    const medicineAnalysis = result.rows.map(row => ({
      medicineId: row[0],
      medicineName: row[1],
      category: row[2],
      manufacturer: row[3],
      stockQuantity: row[4],
      price: row[5],
      timesPrescribed: row[6],
      uniquePrescriptions: row[7],
      uniqueAppointments: row[8],
      totalValuePrescribed: row[9],
      stockStatus: row[10]
    }));

    res.status(200).json({ medicineAnalysis });
  } catch (err) {
    console.error('Error fetching medicine analysis:', err);
    res.status(500).json({ error: 'Failed to fetch medicine analysis' });
  } finally {
    if (connection) await connection.close();
  }
};

// Complex Query 5: Patient appointment and treatment history summary
exports.getPatientTreatmentSummary = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT 
         pat.ID,
         u.NAME as PATIENT_NAME,
         u.EMAIL,
         pat.BLOOD_TYPE,
         pat.GENDER,
         COUNT(DISTINCT da.ID) as TOTAL_APPOINTMENTS,
         COUNT(DISTINCT p.ID) as TOTAL_PRESCRIPTIONS,
         COUNT(DISTINCT pm.MEDICATION_ID) as UNIQUE_MEDICINES_RECEIVED,
         COUNT(DISTINCT lta.ID) as TOTAL_LAB_TESTS,
         COUNT(DISTINCT bba.ID) as TOTAL_BED_BOOKINGS,
         MAX(da.APPOINTMENT_DATE) as LAST_APPOINTMENT_DATE
       FROM PATIENT pat
       INNER JOIN USERS u ON pat.USER_ID = u.ID
       LEFT JOIN DOCTORS_APPOINTMENTS da ON pat.ID = da.PATIENT_ID
       LEFT JOIN PRESCRIPTION p ON da.ID = p.APPOINTMENT_ID
       LEFT JOIN PRESCRIBED_MED pm ON p.ID = pm.PRESCRIPTION_ID
       LEFT JOIN LAB_TEST_APPOINTMENTS lta ON pat.ID = lta.PATIENT_ID
       LEFT JOIN BED_BOOKING_APPOINTMENTS bba ON da.ID = bba.DOCTOR_APPOINTMENT_ID
       GROUP BY pat.ID, u.NAME, u.EMAIL, pat.BLOOD_TYPE, pat.GENDER
       HAVING COUNT(DISTINCT da.ID) > 0
       ORDER BY TOTAL_APPOINTMENTS DESC
       FETCH FIRST 20 ROWS ONLY`
    );

    const patientSummary = result.rows.map(row => ({
      patientId: row[0],
      patientName: row[1],
      email: row[2],
      bloodType: row[3],
      gender: row[4],
      totalAppointments: row[5],
      totalPrescriptions: row[6],
      uniqueMedicinesReceived: row[7],
      totalLabTests: row[8],
      totalBedBookings: row[9],
      lastAppointmentDate: row[10]
    }));

    res.status(200).json({ patientSummary });
  } catch (err) {
    console.error('Error fetching patient summary:', err);
    res.status(500).json({ error: 'Failed to fetch patient summary' });
  } finally {
    if (connection) await connection.close();
  }
};
