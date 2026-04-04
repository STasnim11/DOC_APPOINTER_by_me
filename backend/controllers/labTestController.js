const oracledb = require('oracledb');
const connectDB = require('../db/connection');

/**
 * Get all available lab tests
 * GET /api/lab-tests
 */
exports.getAllLabTests = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        ID,
        TEST_NAME,
        DESCRIPTION,
        PRICE,
        DEPARTMENT,
        PREPARATION_REQUIRED,
        DURATION_MINUTES
      FROM LAB_TESTS
      ORDER BY ID ASC`
    );

    const labTests = result.rows.map(row => ({
      id: row[0],
      testName: row[1],
      description: row[2],
      price: row[3],
      department: row[4],
      preparationRequired: row[5],
      durationMinutes: row[6]
    }));

    res.json({
      success: true,
      labTests
    });

  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get all medical technicians
 * GET /api/medical-technicians
 */
exports.getAllTechnicians = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        mt.ID,
        mt.NAME,
        mt.EMAIL,
        mt.PHONE,
        mt.DEGREES,
        mt.EXPERIENCE_YEARS,
        d.NAME as DEPT_NAME,
        hb.NAME as BRANCH_NAME
      FROM MEDICAL_TECHNICIAN mt
      LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
      LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
      ORDER BY mt.NAME`
    );

    const technicians = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      phone: row[3],
      degrees: row[4],
      experienceYears: row[5],
      department: row[6],
      branch: row[7]
    }));

    res.json({
      success: true,
      technicians
    });

  } catch (error) {
    console.error('Error fetching technicians:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch technicians',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Generate unique lab test token
 */
const generateLabTestToken = async (connection) => {
  const year = new Date().getFullYear();
  
  // Get the last token for this year
  const result = await connection.execute(
    `SELECT MAX(REFERENCE) as LAST_TOKEN 
     FROM LAB_TEST_APPOINTMENTS 
     WHERE REFERENCE LIKE :pattern`,
    { pattern: `LT-${year}-%` }
  );
  
  let nextNumber = 1;
  if (result.rows[0] && result.rows[0][0]) {
    const lastToken = result.rows[0][0];
    const lastNumber = parseInt(lastToken.split('-')[2]);
    nextNumber = lastNumber + 1;
  }
  
  const token = `LT-${year}-${String(nextNumber).padStart(6, '0')}`;
  return token;
};

/**
 * Book a lab test
 * POST /api/lab-test-appointments
 * Body: { patientEmail, testId, technicianId }
 */
exports.bookLabTest = async (req, res) => {
  let connection;
  
  try {
    const { patientEmail, testId, technicianId } = req.body;

    console.log('📋 Booking lab test:', { patientEmail, testId, technicianId });

    // Validate required fields
    if (!patientEmail || !testId) {
      return res.status(400).json({
        success: false,
        message: 'Patient email and test ID are required'
      });
    }

    connection = await connectDB();

    // Get patient ID from email
    const patientResult = await connection.execute(
      `SELECT p.ID 
       FROM PATIENT p
       JOIN USERS u ON p.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email: patientEmail }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patientId = patientResult.rows[0][0];

    // Get test details
    const testResult = await connection.execute(
      `SELECT TEST_NAME, PRICE FROM LAB_TESTS WHERE ID = :testId`,
      { testId }
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    const testName = testResult.rows[0][0];
    const testPrice = testResult.rows[0][1];

    // Get technician name if provided
    let technicianName = null;
    if (technicianId) {
      const techResult = await connection.execute(
        `SELECT NAME FROM MEDICAL_TECHNICIAN WHERE ID = :technicianId`,
        { technicianId }
      );
      if (techResult.rows.length > 0) {
        technicianName = techResult.rows[0][0];
      }
    }

    // Generate unique token
    const token = await generateLabTestToken(connection);

    console.log('🎫 Generated token:', token);

    
const insertResult = await connection.execute(
  `INSERT INTO LAB_TEST_APPOINTMENTS (
    ID, PATIENT_ID, TEST_ID, TECHNICIAN_ID, REFERENCE
  ) VALUES (
    LAB_TEST_APPT_SEQ.NEXTVAL, :patientId, :testId, :technicianId, :token
  ) RETURNING ID INTO :appointmentId`,
  {
    patientId,
    testId,
    technicianId: technicianId || null,
    token,
    appointmentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
  }
);
    const appointmentId = insertResult.outBinds.appointmentId[0];

    await connection.commit();

    console.log('✅ Lab test booked successfully:', appointmentId);

    res.status(201).json({
      success: true,
      message: 'Lab test booked successfully',
      data: {
        appointmentId,
        token,
        testName,
        technicianName,
        price: testPrice
      }
    });

  } catch (error) {
    console.error('❌ Error booking lab test:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to book lab test',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get patient's lab test appointments
 * GET /api/patient/:email/lab-tests
 */
exports.getPatientLabTests = async (req, res) => {
  let connection;
  
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Patient email is required'
      });
    }

    connection = await connectDB();

    // Get patient ID
    const patientResult = await connection.execute(
      `SELECT p.ID 
       FROM PATIENT p
       JOIN USERS u ON p.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email }
    );

    if (patientResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const patientId = patientResult.rows[0][0];

    // Get lab test appointments
    const result = await connection.execute(
      `SELECT 
        lta.ID,
        lta.REFERENCE,
        lt.TEST_NAME,
        lt.PRICE,
        lt.DEPARTMENT,
        mt.NAME as TECHNICIAN_NAME,
        lta.TEST_FILE_URL,
        CASE 
          WHEN lta.TEST_FILE_URL IS NOT NULL THEN 'COMPLETED'
          ELSE 'PENDING'
        END as STATUS
      FROM LAB_TEST_APPOINTMENTS lta
      JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
      LEFT JOIN MEDICAL_TECHNICIAN mt ON lta.TECHNICIAN_ID = mt.ID

      WHERE lta.PATIENT_ID = :patientId
      ORDER BY lta.ID DESC`,
      { patientId }
    );

    const labTests = result.rows.map(row => ({
      id: row[0],
      token: row[1],
      testName: row[2],
      price: row[3],
      department: row[4],
      technicianName: row[5],
      testFileUrl: row[6],
      status: row[7]
    }));

    res.json({
      success: true,
      labTests
    });

  } catch (error) {
    console.error('Error fetching patient lab tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab tests',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Add a new lab test (Admin only)
 * POST /api/admin/lab-tests
 * Body: { testName, description, price, department, preparationRequired, durationMinutes }
 */
exports.addLabTest = async (req, res) => {
  let connection;
  
  try {
    const { testName, description, price, department, preparationRequired, durationMinutes } = req.body;

    // Validate required fields
    if (!testName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Test name and price are required'
      });
    }

    connection = await connectDB();

const result = await connection.execute(
  `INSERT INTO LAB_TESTS (
    ID, TEST_NAME, DESCRIPTION, PRICE, DEPARTMENT,
    PREPARATION_REQUIRED, DURATION_MINUTES, CREATED_AT, UPDATED_AT
  ) VALUES (
    LAB_TESTS_SEQ.NEXTVAL, :testName, :description, :price, :department,
    :preparationRequired, :durationMinutes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) RETURNING ID INTO :testId`,
  {
    testName,
    description: description || null,
    price,
    department: department || null,
    preparationRequired: preparationRequired || null,
    durationMinutes: durationMinutes || null,
    testId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }  // ✅ fixed
  }
);
    const testId = result.outBinds.testId[0];

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Lab test added successfully',
      testId
    });

  } catch (error) {
    console.error('Error adding lab test:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add lab test',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Update a lab test (Admin only)
 * PUT /api/admin/lab-tests/:id
 * Body: { testName, description, price, department, preparationRequired, durationMinutes }
 */
exports.updateLabTest = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const { testName, description, price, department, preparationRequired, durationMinutes } = req.body;

    if (!testName || !price) {
      return res.status(400).json({
        success: false,
        message: 'Test name and price are required'
      });
    }

    connection = await connectDB();

    const result = await connection.execute(
      `UPDATE LAB_TESTS SET
        TEST_NAME = :testName,
        DESCRIPTION = :description,
        PRICE = :price,
        DEPARTMENT = :department,
        PREPARATION_REQUIRED = :preparationRequired,
        DURATION_MINUTES = :durationMinutes
      WHERE ID = :id`,
      {
        testName,
        description: description || null,
        price,
        department: department || null,
        preparationRequired: preparationRequired || null,
        durationMinutes: durationMinutes || null,
        id
      }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Lab test updated successfully'
    });

  } catch (error) {
    console.error('Error updating lab test:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update lab test',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Delete a lab test (Admin only)
 * DELETE /api/admin/lab-tests/:id
 */
exports.deleteLabTest = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;

    connection = await connectDB();

    // Check if test is used in any appointments
    const checkResult = await connection.execute(
      `SELECT COUNT(*) as COUNT FROM LAB_TEST_APPOINTMENTS WHERE TEST_ID = :id`,
      { id }
    );

    const appointmentCount = checkResult.rows[0][0];

    if (appointmentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete lab test. It is used in ${appointmentCount} appointment(s).`
      });
    }

    const result = await connection.execute(
      `DELETE FROM LAB_TESTS WHERE ID = :id`,
      { id }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test not found'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Lab test deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lab test:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete lab test',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get all lab test appointments (Admin only)
 * GET /api/admin/lab-test-appointments
 */
exports.getAllLabTestAppointments = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        lta.ID,
        lta.REFERENCE,
        u.NAME as PATIENT_NAME,
        u.EMAIL as PATIENT_EMAIL,
        lt.TEST_NAME,
        lt.PRICE,
        lt.DEPARTMENT,
        mt.NAME as TECHNICIAN_NAME,
        lta.TEST_FILE_URL,
        CASE 
          WHEN lta.TEST_FILE_URL IS NOT NULL THEN 'COMPLETED'
          ELSE 'PENDING'
        END as STATUS
      FROM LAB_TEST_APPOINTMENTS lta
      JOIN PATIENT p ON lta.PATIENT_ID = p.ID
      JOIN USERS u ON p.USER_ID = u.ID
      JOIN LAB_TESTS lt ON lta.TEST_ID = lt.ID
      LEFT JOIN MEDICAL_TECHNICIAN mt ON lta.TECHNICIAN_ID = mt.ID
      ORDER BY lta.ID ASC`
    );

    const appointments = result.rows.map(row => ({
      id: row[0],
      token: row[1],
      patientName: row[2],
      patientEmail: row[3],
      testName: row[4],
      price: row[5],
      department: row[6],
      technicianName: row[7],
      testFileUrl: row[8],
      status: row[9]
    }));

    res.json({
      success: true,
      appointments
    });

  } catch (error) {
    console.error('Error fetching lab test appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab test appointments',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Update lab test appointment with file URL (Admin only)
 * PUT /api/admin/lab-test-appointments/:id
 * Body: { testFileUrl }
 */
exports.updateLabTestAppointment = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;
    const { testFileUrl } = req.body;

    if (!testFileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Test file URL is required'
      });
    }

    connection = await connectDB();

    const result = await connection.execute(
      `UPDATE LAB_TEST_APPOINTMENTS 
       SET TEST_FILE_URL = :testFileUrl
       WHERE ID = :id`,
      { testFileUrl, id }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test appointment not found'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Lab test appointment updated successfully'
    });

  } catch (error) {
    console.error('Error updating lab test appointment:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update lab test appointment',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Delete lab test appointment (Admin only)
 * DELETE /api/admin/lab-test-appointments/:id
 */
exports.deleteLabTestAppointment = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;

    connection = await connectDB();

    const result = await connection.execute(
      `DELETE FROM LAB_TEST_APPOINTMENTS WHERE ID = :id`,
      { id }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lab test appointment not found'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Lab test appointment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting lab test appointment:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete lab test appointment',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
