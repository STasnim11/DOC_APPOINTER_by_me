// const connectDB = require('../db/connection');
// const oracledb = require('oracledb');

// // Get all medical technicians
// exports.getAllTechnicians = async (req, res) => {
//   let connection;
//   try {
//     connection = await connectDB();
    
//     const result = await connection.execute(
//       `SELECT mt.ID, mt.ADMIN_ID, mt.NAME, mt.EMAIL, mt.PHONE, mt.DEGREES, 
//               mt.EXPERIENCE_YEARS, mt.DEPT_ID, mt.BRANCH_ID,
//               d.NAME as DEPT_NAME,
//               hb.NAME as BRANCH_NAME
//        FROM MEDICAL_TECHNICIAN mt
//        LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
//        LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
//        ORDER BY mt.ID DESC`
//     );

//     const technicians = result.rows.map(row => ({
//       id: row[0],
//       adminId: row[1],
//       name: row[2],
//       email: row[3],
//       phone: row[4],
//       degrees: row[5],
//       experienceYears: row[6],
//       deptId: row[7],
//       branchId: row[8],
//       deptName: row[9],
//       branchName: row[10]
//     }));

//     res.status(200).json({ technicians });
//   } catch (err) {
//     console.error('Error fetching technicians:', err);
//     res.status(500).json({ error: 'Failed to fetch technicians' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Add new medical technician with transaction control
// exports.addTechnician = async (req, res) => {
//   const { name, email, phone, degrees, experienceYears, deptId, branchId } = req.body;
//   const userId = req.user.id;

//   if (!name || !email || !phone) {
//     return res.status(400).json({ error: 'Name, email, and phone are required' });
//   }

//   // Validate experience years is non-negative
//   if (experienceYears !== null && experienceYears !== undefined && experienceYears < 0) {
//     return res.status(400).json({ error: 'Experience years must be 0 or greater' });
//   }

//   let connection;
//   try {
//     connection = await connectDB();
    
//     await connection.execute('BEGIN NULL; END;');

//     // Get ADMIN.ID from USERS_ID
//     const adminResult = await connection.execute(
//       `SELECT ID FROM ADMIN WHERE USERS_ID = :userId`,
//       { userId }
//     );

//     if (adminResult.rows.length === 0) {
//       await connection.rollback();
//       return res.status(403).json({ error: 'Admin record not found' });
//     }

//     const adminId = adminResult.rows[0][0];

//     // Check if email already exists
//     const emailCheck = await connection.execute(
//       `SELECT ID FROM MEDICAL_TECHNICIAN WHERE EMAIL = :email`,
//       { email }
//     );

//     if (emailCheck.rows.length > 0) {
//       await connection.rollback();
//       return res.status(409).json({ error: 'Email already exists' });
//     }

//     // Insert medical technician directly with user info
//     await connection.execute(
//       `INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID)
//        VALUES (:adminId, :name, :email, :phone, :degrees, :experienceYears, :deptId, :branchId)`,
//       { adminId, name, email, phone, degrees, experienceYears, deptId, branchId }
//     );

//     await connection.commit();

//     res.status(201).json({ 
//       message: 'Medical technician added successfully'
//     });
//   } catch (err) {
//     console.error('Error adding technician:', err);
//     if (connection) await connection.rollback();
    
//     // User-friendly error messages
//     // Check for constraint violations using error number (ORA-02290 for check constraint, ORA-00001 for unique)
//     if (err.errorNum === 2290 || (err.message && err.message.includes('CHK_EXPERIENCE_POSITIVE'))) {
//       return res.status(400).json({ error: 'Experience years must be 0 or greater' });
//     }
//     if (err.errorNum === 1 || (err.message && err.message.includes('UK_MED_TECH_EMAIL'))) {
//       return res.status(409).json({ error: 'Email already exists' });
//     }
    
//     res.status(500).json({ error: 'Failed to add technician: ' + err.message });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Update medical technician
// exports.updateTechnician = async (req, res) => {
//   const { id } = req.params;
//   const { degrees, experienceYears, deptId, branchId } = req.body;

//   // Validate experience years is non-negative
//   if (experienceYears !== null && experienceYears !== undefined && experienceYears < 0) {
//     return res.status(400).json({ error: 'Experience years must be 0 or greater' });
//   }

//   let connection;
//   try {
//     connection = await connectDB();
    
//     await connection.execute('BEGIN NULL; END;');

//     await connection.execute(
//       `UPDATE MEDICAL_TECHNICIAN 
//        SET DEGREES = :degrees, EXPERIENCE_YEARS = :experienceYears,
//            DEPT_ID = :deptId, BRANCH_ID = :branchId
//        WHERE ID = :id`,
//       { degrees, experienceYears, deptId, branchId, id }
//     );

//     await connection.commit();

//     res.status(200).json({ message: 'Technician updated successfully' });
//   } catch (err) {
//     console.error('Error updating technician:', err);
//     if (connection) await connection.rollback();
    
//     // User-friendly error messages
//     if (err.errorNum === 2290 || (err.message && err.message.includes('CHK_EXPERIENCE_POSITIVE'))) {
//       return res.status(400).json({ error: 'Experience years must be 0 or greater' });
//     }
    
//     res.status(500).json({ error: 'Failed to update technician' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Delete medical technician
// exports.deleteTechnician = async (req, res) => {
//   const { id } = req.params;

//   let connection;
//   try {
//     connection = await connectDB();
    
//     await connection.execute('BEGIN NULL; END;');

//     await connection.execute(
//       `DELETE FROM MEDICAL_TECHNICIAN WHERE ID = :id`,
//       { id }
//     );

//     await connection.commit();

//     res.status(200).json({ message: 'Technician deleted successfully' });
//   } catch (err) {
//     console.error('Error deleting technician:', err);
//     if (connection) await connection.rollback();
//     res.status(500).json({ error: 'Failed to delete technician' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };
const connectDB = require('../db/connection');
const oracledb = require('oracledb');

// Get all medical technicians
exports.getAllTechnicians = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT mt.ID, mt.ADMIN_ID, mt.NAME, mt.EMAIL, mt.PHONE, mt.DEGREES,
              mt.EXPERIENCE_YEARS, mt.DEPT_ID, mt.BRANCH_ID,
              d.NAME as DEPT_NAME,
              hb.NAME as BRANCH_NAME
       FROM MEDICAL_TECHNICIAN mt
       LEFT JOIN DEPARTMENTS d ON mt.DEPT_ID = d.ID
       LEFT JOIN HOSPITAL_BRANCHES hb ON mt.BRANCH_ID = hb.ID
       ORDER BY mt.ID ASC`
    );

    const technicians = result.rows.map(row => ({
      id: row[0],
      adminId: row[1],
      name: row[2],
      email: row[3],
      phone: row[4],
      degrees: row[5],
      experienceYears: row[6],
      deptId: row[7],
      branchId: row[8],
      deptName: row[9],
      branchName: row[10]
    }));

    res.status(200).json({ technicians });
  } catch (err) {
    console.error('Error fetching technicians:', err);
    res.status(500).json({ error: 'Failed to fetch technicians' });
  } finally {
    if (connection) await connection.close();
  }
};

// Add new medical technician
exports.addTechnician = async (req, res) => {
  const { name, email, phone, degrees, experienceYears, deptId, branchId } = req.body;
  const userId = req.user.id;

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Name, email, and phone are required' });
  }

  if (experienceYears !== null && experienceYears !== undefined && experienceYears < 0) {
    return res.status(400).json({ error: 'Experience years must be 0 or greater' });
  }

  // ✅ FIX 1: Convert empty strings to null so Oracle FK constraints don't blow up
  const branchIdValue = branchId !== undefined && branchId !== '' && branchId !== null
    ? parseInt(branchId)
    : null;
  const deptIdValue = deptId !== undefined && deptId !== '' && deptId !== null
    ? parseInt(deptId)
    : null;
  const experienceValue = experienceYears !== undefined && experienceYears !== '' && experienceYears !== null
    ? parseInt(experienceYears)
    : null;

  let connection;
  try {
    connection = await connectDB();

    await connection.execute('BEGIN NULL; END;');

    // Get ADMIN.ID from USERS_ID
    const adminResult = await connection.execute(
      `SELECT ID FROM ADMIN WHERE USERS_ID = :userId`,
      { userId }
    );

    if (adminResult.rows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Admin record not found' });
    }

    const adminId = adminResult.rows[0][0];

    // Check if email already exists
    const emailCheck = await connection.execute(
      `SELECT ID FROM MEDICAL_TECHNICIAN WHERE EMAIL = :email`,
      { email }
    );

    if (emailCheck.rows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Email already exists' });
    }

    // ✅ FIX 2: Pre-validate branchId if provided
    if (branchIdValue !== null) {
      const branchCheck = await connection.execute(
        `SELECT ID FROM HOSPITAL_BRANCHES WHERE ID = :branchId`,
        { branchId: branchIdValue }
      );
      if (branchCheck.rows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Branch ID ${branchIdValue} does not exist. Please enter a valid Branch ID or leave it blank.`
        });
      }
    }

    // ✅ FIX 2: Pre-validate deptId if provided
    if (deptIdValue !== null) {
      const deptCheck = await connection.execute(
        `SELECT ID FROM DEPARTMENTS WHERE ID = :deptId`,
        { deptId: deptIdValue }
      );
      if (deptCheck.rows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Department ID ${deptIdValue} does not exist. Please enter a valid Department ID or leave it blank.`
        });
      }
    }

    await connection.execute(
      `INSERT INTO MEDICAL_TECHNICIAN (ADMIN_ID, NAME, EMAIL, PHONE, DEGREES, EXPERIENCE_YEARS, DEPT_ID, BRANCH_ID)
       VALUES (:adminId, :name, :email, :phone, :degrees, :experienceYears, :deptId, :branchId)`,
      {
        adminId,
        name,
        email,
        phone,
        degrees: degrees || null,
        experienceYears: experienceValue,
        deptId: deptIdValue,
        branchId: branchIdValue
      }
    );

    await connection.commit();

    res.status(201).json({ message: 'Medical technician added successfully' });
  } catch (err) {
    console.error('Error adding technician:', err);
    if (connection) await connection.rollback();

    // ✅ FIX 3: Catch ORA-02291 (FK violation) with a clear message
    if (err.errorNum === 2291) {
      if (err.message.includes('FK_TECH_BRANCH')) {
        return res.status(400).json({ error: 'Invalid Branch ID — that branch does not exist' });
      }
      if (err.message.includes('FK_TECH_DEPT')) {
        return res.status(400).json({ error: 'Invalid Department ID — that department does not exist' });
      }
      return res.status(400).json({ error: 'Invalid ID — one of the provided IDs does not exist in the database' });
    }
    if (err.errorNum === 2290 || (err.message && err.message.includes('CHK_EXPERIENCE_POSITIVE'))) {
      return res.status(400).json({ error: 'Experience years must be 0 or greater' });
    }
    if (err.errorNum === 1 || (err.message && err.message.includes('UK_MED_TECH_EMAIL'))) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Failed to add technician: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// Update medical technician
exports.updateTechnician = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, degrees, experienceYears, deptId, branchId } = req.body;

  if (experienceYears !== null && experienceYears !== undefined && experienceYears < 0) {
    return res.status(400).json({ error: 'Experience years must be 0 or greater' });
  }

  // ✅ Same null-coercion fix for update
  const branchIdValue = branchId !== undefined && branchId !== '' && branchId !== null
    ? parseInt(branchId)
    : null;
  const deptIdValue = deptId !== undefined && deptId !== '' && deptId !== null
    ? parseInt(deptId)
    : null;
  const experienceValue = experienceYears !== undefined && experienceYears !== '' && experienceYears !== null
    ? parseInt(experienceYears)
    : null;

  let connection;
  try {
    connection = await connectDB();

    await connection.execute('BEGIN NULL; END;');

    // Pre-validate branchId if provided
    if (branchIdValue !== null) {
      const branchCheck = await connection.execute(
        `SELECT ID FROM HOSPITAL_BRANCHES WHERE ID = :branchId`,
        { branchId: branchIdValue }
      );
      if (branchCheck.rows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Branch ID ${branchIdValue} does not exist`
        });
      }
    }

    // Pre-validate deptId if provided
    if (deptIdValue !== null) {
      const deptCheck = await connection.execute(
        `SELECT ID FROM DEPARTMENTS WHERE ID = :deptId`,
        { deptId: deptIdValue }
      );
      if (deptCheck.rows.length === 0) {
        await connection.rollback();
        return res.status(400).json({
          error: `Department ID ${deptIdValue} does not exist`
        });
      }
    }

    await connection.execute(
      `UPDATE MEDICAL_TECHNICIAN
       SET NAME = :name, EMAIL = :email, PHONE = :phone,
           DEGREES = :degrees, EXPERIENCE_YEARS = :experienceYears,
           DEPT_ID = :deptId, BRANCH_ID = :branchId
       WHERE ID = :id`,
      {
        name,
        email,
        phone,
        degrees: degrees || null,
        experienceYears: experienceValue,
        deptId: deptIdValue,
        branchId: branchIdValue,
        id
      }
    );

    await connection.commit();

    res.status(200).json({ message: 'Technician updated successfully' });
  } catch (err) {
    console.error('Error updating technician:', err);
    if (connection) await connection.rollback();

    if (err.errorNum === 2291) {
      if (err.message.includes('FK_TECH_BRANCH')) {
        return res.status(400).json({ error: 'Invalid Branch ID — that branch does not exist' });
      }
      if (err.message.includes('FK_TECH_DEPT')) {
        return res.status(400).json({ error: 'Invalid Department ID — that department does not exist' });
      }
      return res.status(400).json({ error: 'Invalid ID reference' });
    }
    if (err.errorNum === 2290 || (err.message && err.message.includes('CHK_EXPERIENCE_POSITIVE'))) {
      return res.status(400).json({ error: 'Experience years must be 0 or greater' });
    }

    res.status(500).json({ error: 'Failed to update technician' });
  } finally {
    if (connection) await connection.close();
  }
};

// Delete medical technician
exports.deleteTechnician = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();

    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `DELETE FROM MEDICAL_TECHNICIAN WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Technician deleted successfully' });
  } catch (err) {
    console.error('Error deleting technician:', err);
    if (connection) await connection.rollback();

    if (err.errorNum === 2292) {
      return res.status(400).json({
        error: 'Cannot delete — this technician is referenced by other records (e.g. lab test appointments)'
      });
    }

    res.status(500).json({ error: 'Failed to delete technician' });
  } finally {
    if (connection) await connection.close();
  }
};