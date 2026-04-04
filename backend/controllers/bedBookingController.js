const connectDB = require('../db/connection');

/**
 * Get all available beds
 * GET /api/beds/available
 */
exports.getAvailableBeds = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        ID,
        BED_NUMBER,
        WARD_NAME,
        BED_TYPE,
        PRICE_PER_DAY,
        FLOOR_NUMBER
      FROM HOSPITAL_BEDS
      WHERE STATUS = 'available'
      ORDER BY WARD_NAME, BED_NUMBER`
    );

    const beds = result.rows.map(row => ({
      id: row[0],
      bedNumber: row[1],
      wardName: row[2],
      bedType: row[3],
      pricePerDay: row[4],
      floorNumber: row[5]
    }));

    res.json({
      success: true,
      beds
    });

  } catch (error) {
    console.error('Error fetching available beds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available beds',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Book a bed
 * POST /api/bed-bookings
 * Body: { appointmentId, bedId }
 */
exports.bookBed = async (req, res) => {
  let connection;
  
  try {
    const { appointmentId, bedId } = req.body;

    if (!appointmentId || !bedId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and Bed ID are required'
      });
    }

    connection = await connectDB();

    // Check if bed is available
    const bedCheck = await connection.execute(
      `SELECT STATUS FROM HOSPITAL_BEDS WHERE ID = :bedId`,
      { bedId }
    );

    if (bedCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bed not found'
      });
    }

    if (bedCheck.rows[0][0] !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Bed is not available'
      });
    }

    // Insert bed booking
    const insertResult = await connection.execute(
      `INSERT INTO BED_BOOKING_APPOINTMENTS (
        DOCTOR_APPOINTMENT_ID,
        BED_ID,
        STATUS
      ) VALUES (
        :appointmentId,
        :bedId,
        'BOOKED'
      ) RETURNING ID INTO :bookingId`,
      {
        appointmentId,
        bedId,
        bookingId: { dir: connectDB.oracledb.BIND_OUT, type: connectDB.oracledb.NUMBER }
      }
    );

    const bookingId = insertResult.outBinds.bookingId[0];

    // Update bed status to occupied
    await connection.execute(
      `UPDATE HOSPITAL_BEDS 
       SET STATUS = 'occupied', UPDATED_AT = CURRENT_TIMESTAMP
       WHERE ID = :bedId`,
      { bedId }
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Bed booked successfully',
      bookingId
    });

  } catch (error) {
    console.error('Error booking bed:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to book bed',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get all bed bookings (Admin)
 * GET /api/admin/bed-bookings
 */
exports.getAllBedBookings = async (req, res) => {
  let connection;
  
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
        bba.ID as BOOKING_ID,
        bba.STATUS as BOOKING_STATUS,
        hb.BED_NUMBER,
        hb.WARD_NAME,
        hb.BED_TYPE,
        hb.PRICE_PER_DAY,
        hb.FLOOR_NUMBER,
        da.APPOINTMENT_DATE,
        da.START_TIME,
        da.END_TIME,
        du.NAME as DOCTOR_NAME,
        pu.NAME as PATIENT_NAME,
        pu.EMAIL as PATIENT_EMAIL
      FROM BED_BOOKING_APPOINTMENTS bba
      JOIN HOSPITAL_BEDS hb ON bba.BED_ID = hb.ID
      JOIN DOCTORS_APPOINTMENTS da ON bba.DOCTOR_APPOINTMENT_ID = da.ID
      JOIN DOCTOR d ON da.DOCTOR_ID = d.ID
      JOIN USERS du ON d.USER_ID = du.ID
      JOIN PATIENT p ON da.PATIENT_ID = p.ID
      JOIN USERS pu ON p.USER_ID = pu.ID
      ORDER BY bba.ID ASC`
    );

    const bookings = result.rows.map(row => ({
      id: row[0],
      status: row[1],
      bedNumber: row[2],
      wardName: row[3],
      bedType: row[4],
      pricePerDay: row[5],
      floorNumber: row[6],
      appointmentDate: row[7],
      startTime: row[8],
      endTime: row[9],
      doctorName: row[10],
      patientName: row[11],
      patientEmail: row[12],
      bookedAt: new Date().toISOString() // Current timestamp
    }));

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Error fetching bed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed bookings',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Get patient's bed bookings
 * GET /api/patient/:email/bed-bookings
 */
exports.getPatientBedBookings = async (req, res) => {
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

    // Get bed bookings
    const result = await connection.execute(
      `SELECT 
        bba.ID,
        bba.DOCTOR_APPOINTMENT_ID,
        hb.BED_NUMBER,
        hb.WARD_NAME,
        hb.BED_TYPE,
        hb.PRICE_PER_DAY,
        hb.FLOOR_NUMBER,
        da.APPOINTMENT_DATE,
        bba.STATUS,
        da.START_TIME,
        da.END_TIME
      FROM BED_BOOKING_APPOINTMENTS bba
      JOIN HOSPITAL_BEDS hb ON bba.BED_ID = hb.ID
      JOIN DOCTORS_APPOINTMENTS da ON bba.DOCTOR_APPOINTMENT_ID = da.ID
      WHERE da.PATIENT_ID = :patientId
      ORDER BY bba.ID ASC`,
      { patientId }
    );

    const bookings = result.rows.map(row => ({
      id: row[0],
      appointmentId: row[1],
      bedNumber: row[2],
      wardName: row[3],
      bedType: row[4],
      pricePerDay: row[5],
      floorNumber: row[6],
      appointmentDate: row[7],
      status: row[8],
      startTime: row[9],
      endTime: row[10]
    }));

    res.json({
      success: true,
      bookings
    });

  } catch (error) {
    console.error('Error fetching patient bed bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bed bookings',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Delete bed booking (Admin)
 * DELETE /api/admin/bed-bookings/:id
 */
exports.deleteBedBooking = async (req, res) => {
  let connection;
  
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    connection = await connectDB();

    // Get bed ID before deleting
    const bookingResult = await connection.execute(
      `SELECT BED_ID FROM BED_BOOKING_APPOINTMENTS WHERE ID = :id`,
      { id }
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bed booking not found'
      });
    }

    const bedId = bookingResult.rows[0][0];

    // Delete booking
    await connection.execute(
      `DELETE FROM BED_BOOKING_APPOINTMENTS WHERE ID = :id`,
      { id }
    );

    // Update bed status back to available
    await connection.execute(
      `UPDATE HOSPITAL_BEDS 
       SET STATUS = 'available', UPDATED_AT = CURRENT_TIMESTAMP
       WHERE ID = :bedId`,
      { bedId }
    );

    await connection.commit();

    res.json({
      success: true,
      message: 'Bed booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting bed booking:', error);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({
      success: false,
      message: 'Failed to delete bed booking',
      error: error.message
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
