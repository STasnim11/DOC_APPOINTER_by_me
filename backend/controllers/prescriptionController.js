const connectDB = require('../db/connection');

/**
 * Create a new prescription with medicines
 * POST /api/prescriptions
 * Body: {
 *   appointmentId: number,
 *   chiefComplaints: string,
 *   investigations: string,
 *   requiredTests: string,
 *   diagnosis: string,
 *   history: string,
 *   instructions: string,
 *   visitAgainAt: date (optional),
 *   medicines: [
 *     {
 *       medicineId: number,
 *       dosage: string,
 *       duration: string
 *     }
 *   ]
 * }
 */
exports.createPrescription = async (req, res) => {
  console.log('🚀 ========== CREATE PRESCRIPTION CALLED ==========');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  
  let connection;
  
  try {
    console.log('📝 Creating prescription - Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      appointmentId,
      chiefComplaints,
      investigations,
      requiredTests,
      diagnosis,
      history,
      instructions,
      visitAgainAt,
      medicines = []
    } = req.body;

    console.log('📋 Extracted data:', { appointmentId, medicinesCount: medicines.length });

    // Validate required fields
    if (!appointmentId) {
      console.log('❌ Validation failed: appointmentId missing');
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    console.log('🔌 Connecting to database...');
    connection = await connectDB();
    console.log('✅ Database connected');

    // Check if appointment exists
    console.log('🔍 Checking if appointment exists:', appointmentId);
    const appointmentCheck = await connection.execute(
      `SELECT ID FROM DOCTORS_APPOINTMENTS WHERE ID = :appointmentId`,
      { appointmentId }
    );

    if (appointmentCheck.rows.length === 0) {
      console.log('❌ Appointment not found:', appointmentId);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    console.log('✅ Appointment exists');

    // Check if prescription already exists for this appointment
    console.log('🔍 Checking for existing prescription...');
    const existingPrescription = await connection.execute(
      `SELECT ID FROM PRESCRIPTION WHERE APPOINTMENT_ID = :appointmentId`,
      { appointmentId }
    );

    if (existingPrescription.rows.length > 0) {
      console.log('❌ Prescription already exists for appointment:', appointmentId);
      return res.status(400).json({
        success: false,
        message: 'Prescription already exists for this appointment'
      });
    }
    console.log('✅ No existing prescription');

    // Insert prescription
    console.log('💾 Inserting prescription...');
    console.log('📅 visitAgainAt:', visitAgainAt);
    
    const prescriptionResult = await connection.execute(
      `INSERT INTO PRESCRIPTION (
        APPOINTMENT_ID,
        DATE_ISSUED,
        CHIEF_COMPLAINTS,
        INVESTIGATIONS,
        REQUIRED_TESTS,
        DIAGNOSIS,
        HISTORY,
        INSTRUCTIONS,
        VISIT_AGAIN_AT
      ) VALUES (
        :appointmentId,
        SYSDATE,
        :chiefComplaints,
        :investigations,
        :requiredTests,
        :diagnosis,
        :history,
        :instructions,
        CASE WHEN :visitAgainAt IS NOT NULL THEN TO_DATE(:visitAgainAt, 'YYYY-MM-DD') ELSE NULL END
      ) RETURNING ID INTO :prescriptionId`,
      {
        appointmentId,
        chiefComplaints: chiefComplaints || null,
        investigations: investigations || null,
        requiredTests: requiredTests || null,
        diagnosis: diagnosis || null,
        history: history || null,
        instructions: instructions || null,
        visitAgainAt: visitAgainAt || null,
        prescriptionId: { dir: connectDB.oracledb.BIND_OUT, type: connectDB.oracledb.NUMBER }
      }
    );

    const prescriptionId = prescriptionResult.outBinds.prescriptionId[0];
    console.log('✅ Prescription inserted with ID:', prescriptionId);

    // Insert prescribed medicines if provided
    if (medicines && medicines.length > 0) {
      console.log('💊 Processing medicines:', medicines.length);
      for (const medicine of medicines) {
        const { medicineName, dosage, duration } = medicine;

        if (!medicineName) {
          console.log('⚠️ Skipping empty medicine entry');
          continue;
        }

        console.log('🔍 Looking up medicine:', medicineName);
        // Look up medicine ID by name
        const medicineCheck = await connection.execute(
          `SELECT id FROM medicines WHERE UPPER(name) = UPPER(:medicineName)`,
          { medicineName: medicineName.trim() }
        );

        if (medicineCheck.rows.length === 0) {
          console.warn(`❌ Medicine "${medicineName}" not found in database, skipping`);
          continue;
        }

        const medicineId = medicineCheck.rows[0][0];
        console.log(`✅ Found medicine ID: ${medicineId} for "${medicineName}"`);

        console.log('💾 Inserting into PRESCRIBED_MED...');
        await connection.execute(
          `INSERT INTO PRESCRIBED_MED (PRESCRIPTION_ID, MEDICATION_ID, DOSAGE, DURATION)
           VALUES (:prescriptionId, :medicineId, :dosage, :duration)`,
          {
            prescriptionId,
            medicineId,
            dosage: dosage || null,
            duration: duration || null
          }
        );
        console.log(`✅ Medicine inserted: ${medicineName}`);
      }
    } else {
      console.log('⚠️ No medicines to insert');
    }

    console.log('💾 Committing transaction...');
    await connection.commit();
    console.log('✅ Transaction committed successfully');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescriptionId
    });
    console.log('✅ Response sent to client');

  } catch (error) {
    console.error('❌ ERROR creating prescription:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Transaction rolled back');
      } catch (rollbackError) {
        console.error('❌ Rollback error:', rollbackError);
      }
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get prescription by appointment ID
 * GET /api/prescriptions/appointment/:appointmentId
 */
exports.getPrescriptionByAppointment = async (req, res) => {
  let connection;
  
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    connection = await connectDB();

    // Get prescription details
    const prescriptionResult = await connection.execute(
      `SELECT 
        p.ID,
        p.APPOINTMENT_ID,
        p.DATE_ISSUED,
        p.CHIEF_COMPLAINTS,
        p.INVESTIGATIONS,
        p.REQUIRED_TESTS,
        p.DIAGNOSIS,
        p.HISTORY,
        p.INSTRUCTIONS,
        p.VISIT_AGAIN_AT,
        da.APPOINTMENT_DATE,
        da.STATUS as APPOINTMENT_STATUS,
        u.NAME as PATIENT_NAME,
        du.NAME as DOCTOR_NAME
      FROM PRESCRIPTION p
      JOIN DOCTORS_APPOINTMENTS da ON p.APPOINTMENT_ID = da.ID
      JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
      JOIN USERS u ON pat.USER_ID = u.ID
      JOIN DOCTOR doc ON da.DOCTOR_ID = doc.ID
      JOIN USERS du ON doc.USER_ID = du.ID
      WHERE p.APPOINTMENT_ID = :appointmentId`,
      { appointmentId }
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found for this appointment'
      });
    }

    const prescription = prescriptionResult.rows[0];

    // Get prescribed medicines
    const medicinesResult = await connection.execute(
      `SELECT 
        m.id,
        m.name,
        pm.DOSAGE,
        pm.DURATION,
        m.manufacturer,
        m.category
      FROM PRESCRIBED_MED pm
      JOIN medicines m ON pm.MEDICATION_ID = m.id
      WHERE pm.PRESCRIPTION_ID = :prescriptionId`,
      { prescriptionId: prescription[0] } // prescription ID
    );

    const medicines = medicinesResult.rows.map(row => ({
      id: row[0],
      medicineName: row[1],
      dosage: row[2],
      duration: row[3],
      manufacturer: row[4],
      category: row[5]
    }));

    res.json({
      success: true,
      prescription: {
        id: prescription[0],
        appointmentId: prescription[1],
        dateIssued: prescription[2],
        chiefComplaints: prescription[3],
        investigations: prescription[4],
        requiredTests: prescription[5],
        diagnosis: prescription[6],
        history: prescription[7],
        instructions: prescription[8],
        visitAgainAt: prescription[9],
        appointmentDate: prescription[10],
        appointmentStatus: prescription[11],
        patientName: prescription[12],
        doctorName: prescription[13],
        medicines
      }
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get prescription by prescription ID
 * GET /api/prescriptions/:id
 */
exports.getPrescriptionById = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Prescription ID is required'
      });
    }

    connection = await connectDB();

    // Get prescription details
    const prescriptionResult = await connection.execute(
      `SELECT 
        p.ID,
        p.APPOINTMENT_ID,
        p.DATE_ISSUED,
        p.CHIEF_COMPLAINTS,
        p.INVESTIGATIONS,
        p.REQUIRED_TESTS,
        p.DIAGNOSIS,
        p.HISTORY,
        p.INSTRUCTIONS,
        p.VISIT_AGAIN_AT,
        da.APPOINTMENT_DATE,
        da.STATUS as APPOINTMENT_STATUS,
        u.NAME as PATIENT_NAME,
        du.NAME as DOCTOR_NAME
      FROM PRESCRIPTION p
      JOIN DOCTORS_APPOINTMENTS da ON p.APPOINTMENT_ID = da.ID
      JOIN PATIENT pat ON da.PATIENT_ID = pat.ID
      JOIN USERS u ON pat.USER_ID = u.ID
      JOIN DOCTOR doc ON da.DOCTOR_ID = doc.ID
      JOIN USERS du ON doc.USER_ID = du.ID
      WHERE p.ID = :id`,
      { id }
    );

    if (prescriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const prescription = prescriptionResult.rows[0];

    // Get prescribed medicines
    const medicinesResult = await connection.execute(
      `SELECT 
        m.id,
        m.name,
        pm.DOSAGE,
        pm.DURATION,
        m.manufacturer,
        m.category
      FROM PRESCRIBED_MED pm
      JOIN medicines m ON pm.MEDICATION_ID = m.id
      WHERE pm.PRESCRIPTION_ID = :prescriptionId`,
      { prescriptionId: id }
    );

    const medicines = medicinesResult.rows.map(row => ({
      id: row[0],
      medicineName: row[1],
      dosage: row[2],
      duration: row[3],
      manufacturer: row[4],
      category: row[5]
    }));

    res.json({
      success: true,
      prescription: {
        id: prescription[0],
        appointmentId: prescription[1],
        dateIssued: prescription[2],
        chiefComplaints: prescription[3],
        investigations: prescription[4],
        requiredTests: prescription[5],
        diagnosis: prescription[6],
        history: prescription[7],
        instructions: prescription[8],
        visitAgainAt: prescription[9],
        appointmentDate: prescription[10],
        appointmentStatus: prescription[11],
        patientName: prescription[12],
        doctorName: prescription[13],
        medicines
      }
    });

  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Update prescription
 * PUT /api/prescriptions/:id
 */
exports.updatePrescription = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const {
      chiefComplaints,
      investigations,
      requiredTests,
      diagnosis,
      history,
      instructions,
      visitAgainAt,
      medicines = []
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Prescription ID is required'
      });
    }

    connection = await connectDB();

    // Check if prescription exists
    const prescriptionCheck = await connection.execute(
      `SELECT ID FROM PRESCRIPTION WHERE ID = :id`,
      { id }
    );

    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Update prescription
    await connection.execute(
      `UPDATE PRESCRIPTION SET
        CHIEF_COMPLAINTS = :chiefComplaints,
        INVESTIGATIONS = :investigations,
        REQUIRED_TESTS = :requiredTests,
        DIAGNOSIS = :diagnosis,
        HISTORY = :history,
        INSTRUCTIONS = :instructions,
        VISIT_AGAIN_AT = TO_DATE(:visitAgainAt, 'YYYY-MM-DD')    
      WHERE ID = :id`,
      {
        id,
        chiefComplaints: chiefComplaints || null,
        investigations: investigations || null,
        requiredTests: requiredTests || null,
        diagnosis: diagnosis || null,
        history: history || null,
        instructions: instructions || null,
        visitAgainAt: visitAgainAt || null
      }
    );

    // Update medicines if provided
    if (medicines && medicines.length > 0) {
      // Delete existing prescribed medicines
      await connection.execute(
        `DELETE FROM PRESCRIBED_MED WHERE PRESCRIPTION_ID = :id`,
        { id }
      );

      // Insert new medicines
      for (const medicine of medicines) {
        const { medicineName, dosage, duration } = medicine;

        if (!medicineName) {
          continue;
        }

        // Find medicine by name (case-insensitive) from medicines table
        const medicineCheck = await connection.execute(
          `SELECT id FROM medicines WHERE UPPER(name) = UPPER(:medicineName)`,
          { medicineName: medicineName.trim() }
        );

        if (medicineCheck.rows.length === 0) {
          console.warn(`Medicine "${medicineName}" not found in database, skipping`);
          continue;
        }

        const medicineId = medicineCheck.rows[0][0];

        // Insert into PRESCRIBED_MED with dosage and duration
        await connection.execute(
          `INSERT INTO PRESCRIBED_MED (
            PRESCRIPTION_ID,
            MEDICATION_ID,
            DOSAGE,
            DURATION
          ) VALUES (
            :prescriptionId,
            :medicineId,
            :dosage,
            :duration
          )`,
          {
            prescriptionId: id,
            medicineId,
            dosage: dosage || null,
            duration: duration || null
          }
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Prescription updated successfully'
    });

  } catch (error) {
    console.error('Error updating prescription:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Delete prescription
 * DELETE /api/prescriptions/:id
 */
exports.deletePrescription = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Prescription ID is required'
      });
    }

    connection = await connectDB();

    // Check if prescription exists
    const prescriptionCheck = await connection.execute(
      `SELECT ID FROM PRESCRIPTION WHERE ID = :id`,
      { id }
    );

    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Delete prescribed medicines first (foreign key constraint)
    await connection.execute(
      `DELETE FROM PRESCRIBED_MED WHERE PRESCRIPTION_ID = :id`,
      { id }
    );

    // Delete prescription
    await connection.execute(
      `DELETE FROM PRESCRIPTION WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting prescription:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete prescription',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get all available medicines
 * GET /api/prescriptions/medicines
 */
exports.getAllMedicines = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        id,
        name,
        description,
        manufacturer,
        price,
        stock_quantity,
        category
      FROM medicines
      ORDER BY name`
    );

    const medicines = result.rows.map(row => ({
      id: row[0],
      medicineName: row[1],
      description: row[2],
      manufacturer: row[3],
      price: row[4],
      stockQuantity: row[5],
      category: row[6]
    }));

    res.json({
      success: true,
      medicines
    });

  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
