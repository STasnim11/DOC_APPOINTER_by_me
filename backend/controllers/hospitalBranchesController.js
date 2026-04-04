const connectDB = require('../db/connection');

// Get all hospital branches
exports.getAllBranches = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT ID, ADMIN_ID, NAME, ADDRESS, ESTABLISHED_DATE
       FROM HOSPITAL_BRANCHES
       ORDER BY ID ASC`
    );

    const branches = result.rows.map(row => ({
      id: row[0],
      adminId: row[1],
      name: row[2],
      address: row[3],
      establishedDate: row[4]
    }));

    res.status(200).json({ branches });
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({ error: 'Failed to fetch branches' });
  } finally {
    if (connection) await connection.close();
  }
};

// Add new hospital branch with transaction control
exports.addBranch = async (req, res) => {
  const { name, address, establishedDate } = req.body;
  const userId = req.user.id; // This is the USERS.ID from JWT
  
  if (!name) {
    return res.status(400).json({ error: 'Branch name is required' });
  }

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    // Get ADMIN.ID from ADMIN table using USERS_ID
    const adminResult = await connection.execute(
      `SELECT ID FROM ADMIN WHERE USERS_ID = :userId`,
      { userId }
    );

    if (adminResult.rows.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Admin record not found for this user' });
    }

    const adminId = adminResult.rows[0][0];

    // Build query with ADMIN_ID
    let query, params;
    if (establishedDate) {
      query = `INSERT INTO HOSPITAL_BRANCHES (ADMIN_ID, NAME, ADDRESS, ESTABLISHED_DATE)
               VALUES (:adminId, :name, :address, TO_DATE(:establishedDate, 'YYYY-MM-DD'))`;
      params = { adminId, name, address, establishedDate };
    } else {
      query = `INSERT INTO HOSPITAL_BRANCHES (ADMIN_ID, NAME, ADDRESS)
               VALUES (:adminId, :name, :address)`;
      params = { adminId, name, address };
    }

    await connection.execute(query, params);
    await connection.commit();

    res.status(201).json({ message: 'Hospital branch added successfully' });
  } catch (err) {
    console.error('Error adding branch:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback error:', rollbackErr);
      }
    }
    res.status(500).json({ error: 'Failed to add branch: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
};

// Update hospital branch
exports.updateBranch = async (req, res) => {
  const { id } = req.params;
  const { name, address, establishedDate } = req.body;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `UPDATE HOSPITAL_BRANCHES 
       SET NAME = :name, ADDRESS = :address, 
           ESTABLISHED_DATE = TO_DATE(:establishedDate, 'YYYY-MM-DD')
       WHERE ID = :id`,
      { name, address, establishedDate, id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Branch updated successfully' });
  } catch (err) {
    console.error('Error updating branch:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to update branch' });
  } finally {
    if (connection) await connection.close();
  }
};

// Delete hospital branch
exports.deleteBranch = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `DELETE FROM HOSPITAL_BRANCHES WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Branch deleted successfully' });
  } catch (err) {
    console.error('Error deleting branch:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to delete branch' });
  } finally {
    if (connection) await connection.close();
  }
};
