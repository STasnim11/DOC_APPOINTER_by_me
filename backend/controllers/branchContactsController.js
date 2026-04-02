const connectDB = require('../db/connection');

// Get all branch contacts
exports.getAllBranchContacts = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT bc.ID, bc.ADMIN_ID, bc.BRANCH_ID, bc.CONTACT_NO, bc.TYPE,
              hb.NAME as BRANCH_NAME, hb.ADDRESS as BRANCH_ADDRESS
       FROM BRANCH_CONTACTS bc
       LEFT JOIN HOSPITAL_BRANCHES hb ON bc.BRANCH_ID = hb.ID
       ORDER BY bc.ID DESC`
    );

    const contacts = result.rows.map(row => ({
      id: row[0],
      adminId: row[1],
      branchId: row[2],
      contactNo: row[3],
      type: row[4],
      branchName: row[5],
      branchAddress: row[6]
    }));

    res.status(200).json({ contacts });
  } catch (err) {
    console.error('Error fetching branch contacts:', err);
    res.status(500).json({ error: 'Failed to fetch branch contacts' });
  } finally {
    if (connection) await connection.close();
  }
};

// Add new branch contact with transaction control
exports.addBranchContact = async (req, res) => {
  const { branchId, contactNo, type } = req.body;
  const userId = req.user.id;

  if (!branchId || !contactNo || !type) {
    return res.status(400).json({ error: 'All fields are required' });
  }

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

    // Verify branch exists
    const branchCheck = await connection.execute(
      `SELECT ID FROM HOSPITAL_BRANCHES WHERE ID = :branchId`,
      { branchId }
    );

    if (branchCheck.rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Branch not found' });
    }

    // Insert branch contact
    await connection.execute(
      `INSERT INTO BRANCH_CONTACTS (ADMIN_ID, BRANCH_ID, CONTACT_NO, TYPE)
       VALUES (:adminId, :branchId, :contactNo, :type)`,
      { adminId, branchId, contactNo, type }
    );

    await connection.commit();

    res.status(201).json({ message: 'Branch contact added successfully' });
  } catch (err) {
    console.error('Error adding branch contact:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    
    res.status(409).json({ error: 'This contact already exists for this branch and type' });
  } finally {
    if (connection) await connection.close();
  }
};

// Update branch contact with transaction control
exports.updateBranchContact = async (req, res) => {
  const { id } = req.params;
  const { branchId, contactNo, type } = req.body;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `UPDATE BRANCH_CONTACTS 
       SET BRANCH_ID = :branchId, CONTACT_NO = :contactNo, TYPE = :type
       WHERE ID = :id`,
      { branchId, contactNo, type, id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Branch contact updated successfully' });
  } catch (err) {
    console.error('Error updating branch contact:', err);
    if (connection) await connection.rollback();
    
    res.status(409).json({ error: 'This contact already exists for this branch and type' });
  } finally {
    if (connection) await connection.close();
  }
};

// Delete branch contact with transaction control
exports.deleteBranchContact = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `DELETE FROM BRANCH_CONTACTS WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Branch contact deleted successfully' });
  } catch (err) {
    console.error('Error deleting branch contact:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to delete branch contact' });
  } finally {
    if (connection) await connection.close();
  }
};
