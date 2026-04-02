const connectDB = require('../db/connection');

// Use Function: Get doctor appointment count
exports.getDoctorAppointmentCount = async (req, res) => {
  const { doctorId } = req.params;
  let connection;
  
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT fn_get_doctor_appointment_count(:doctorId) as APPOINTMENT_COUNT FROM DUAL`,
      { doctorId }
    );

    const count = result.rows[0][0];
    res.status(200).json({ doctorId, appointmentCount: count });
  } catch (err) {
    console.error('Error getting appointment count:', err);
    res.status(500).json({ error: 'Failed to get appointment count' });
  } finally {
    if (connection) await connection.close();
  }
};

// Use Function: Calculate bed occupancy rate
exports.getBedOccupancyRate = async (req, res) => {
  const { branchId } = req.params;
  let connection;
  
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT fn_calculate_bed_occupancy(:branchId) as OCCUPANCY_RATE FROM DUAL`,
      { branchId }
    );

    const rate = result.rows[0][0];
    res.status(200).json({ branchId, occupancyRate: rate });
  } catch (err) {
    console.error('Error calculating bed occupancy:', err);
    res.status(500).json({ error: 'Failed to calculate bed occupancy' });
  } finally {
    if (connection) await connection.close();
  }
};

// Use Function: Get patient total expenses
exports.getPatientTotalExpenses = async (req, res) => {
  const { patientId } = req.params;
  let connection;
  
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT fn_get_patient_total_expenses(:patientId) as TOTAL_EXPENSES FROM DUAL`,
      { patientId }
    );

    const expenses = result.rows[0][0];
    res.status(200).json({ patientId, totalExpenses: expenses });
  } catch (err) {
    console.error('Error getting patient expenses:', err);
    res.status(500).json({ error: 'Failed to get patient expenses' });
  } finally {
    if (connection) await connection.close();
  }
};

// Use Procedure: Book appointment with validation
exports.bookAppointmentWithProcedure = async (req, res) => {
  const { patientId, doctorId, appointmentDate, timeSlotId, appointmentType } = req.body;
  let connection;
  
  try {
    connection = await connectDB();
    
    // Call stored procedure
    const result = await connection.execute(
      `BEGIN
         sp_book_appointment(
           :patientId, :doctorId, TO_DATE(:appointmentDate, 'YYYY-MM-DD'),
           :timeSlotId, :appointmentType, :appointmentId
         );
       END;`,
      {
        patientId,
        doctorId,
        appointmentDate,
        timeSlotId,
        appointmentType,
        appointmentId: { dir: connection.BIND_OUT, type: connection.NUMBER }
      }
    );

    const appointmentId = result.outBinds.appointmentId;
    res.status(201).json({ 
      message: 'Appointment booked successfully',
      appointmentId 
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ error: err.message || 'Failed to book appointment' });
  } finally {
    if (connection) await connection.close();
  }
};

// Use Procedure: Generate bill
exports.generateBill = async (req, res) => {
  const { appointmentId, consultationFee } = req.body;
  const adminId = req.user.id;
  let connection;
  
  try {
    connection = await connectDB();
    
    // Call stored procedure
    const result = await connection.execute(
      `BEGIN
         sp_generate_bill(:adminId, :appointmentId, :consultationFee, :billId);
       END;`,
      {
        adminId,
        appointmentId,
        consultationFee,
        billId: { dir: connection.BIND_OUT, type: connection.NUMBER }
      }
    );

    const billId = result.outBinds.billId;
    res.status(201).json({ 
      message: 'Bill generated successfully',
      billId 
    });
  } catch (err) {
    console.error('Error generating bill:', err);
    res.status(500).json({ error: err.message || 'Failed to generate bill' });
  } finally {
    if (connection) await connection.close();
  }
};

// Use Procedure: Update medicine stock
exports.updateMedicineStock = async (req, res) => {
  const { medicationId, quantity } = req.body;
  let connection;
  
  try {
    connection = await connectDB();
    
    // Call stored procedure
    await connection.execute(
      `BEGIN
         sp_update_medicine_stock(:medicationId, :quantity);
       END;`,
      { medicationId, quantity }
    );

    res.status(200).json({ 
      message: 'Medicine stock updated successfully'
    });
  } catch (err) {
    console.error('Error updating medicine stock:', err);
    res.status(500).json({ error: err.message || 'Failed to update stock' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get all database features statistics (uses all functions)
exports.getDatabaseFeaturesStats = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();
    
    // Get all doctors with their appointment counts
    const doctorsResult = await connection.execute(
      `SELECT d.ID, u.NAME, fn_get_doctor_appointment_count(d.ID) as APPOINTMENT_COUNT
       FROM DOCTOR d
       INNER JOIN USERS u ON d.USER_ID = u.ID
       ORDER BY APPOINTMENT_COUNT DESC
       FETCH FIRST 10 ROWS ONLY`
    );

    const doctors = doctorsResult.rows.map(row => ({
      doctorId: row[0],
      doctorName: row[1],
      appointmentCount: row[2]
    }));

    // Get all branches with bed occupancy
    const branchesResult = await connection.execute(
      `SELECT hb.ID, hb.NAME, fn_calculate_bed_occupancy(hb.ID) as OCCUPANCY_RATE
       FROM HOSPITAL_BRANCHES hb
       ORDER BY OCCUPANCY_RATE DESC`
    );

    const branches = branchesResult.rows.map(row => ({
      branchId: row[0],
      branchName: row[1],
      occupancyRate: row[2]
    }));

    // Get all patients with total expenses
    const patientsResult = await connection.execute(
      `SELECT p.ID, u.NAME, fn_get_patient_total_expenses(p.ID) as TOTAL_EXPENSES
       FROM PATIENT p
       INNER JOIN USERS u ON p.USER_ID = u.ID
       WHERE fn_get_patient_total_expenses(p.ID) > 0
       ORDER BY TOTAL_EXPENSES DESC
       FETCH FIRST 10 ROWS ONLY`
    );

    const patients = patientsResult.rows.map(row => ({
      patientId: row[0],
      patientName: row[1],
      totalExpenses: row[2]
    }));

    res.status(200).json({
      doctors,
      branches,
      patients
    });
  } catch (err) {
    console.error('Error getting database features stats:', err);
    res.status(500).json({ error: 'Failed to get statistics' });
  } finally {
    if (connection) await connection.close();
  }
};
