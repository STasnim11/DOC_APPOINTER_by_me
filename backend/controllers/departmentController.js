const connectDB = require('../db/connection');

// Get all departments
exports.getAllDepartments = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();
    
    const result = await connection.execute(
      `SELECT ID, ADMIN_ID, NAME, DESCRIPTION
       FROM DEPARTMENTS
       ORDER BY ID ASC`
    );

    const departments = result.rows.map(row => ({
      id: row[0],
      adminId: row[1],
      name: row[2],
      description: row[3]
    }));

    res.status(200).json({ departments });
  } catch (err) {
    console.error('Error fetching departments:', err);
    res.status(500).json({ error: 'Failed to fetch departments' });
  } finally {
    if (connection) await connection.close();
  }
};

// Add new department with transaction control
exports.addDepartment = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ error: 'Department name is required' });
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

    // Check if department already exists
    const deptCheck = await connection.execute(
      `SELECT ID FROM DEPARTMENTS WHERE UPPER(NAME) = UPPER(:name)`,
      { name }
    );

    if (deptCheck.rows.length > 0) {
      await connection.rollback();
      return res.status(409).json({ error: 'Department already exists' });
    }

    await connection.execute(
      `INSERT INTO DEPARTMENTS (ADMIN_ID, NAME, DESCRIPTION)
       VALUES (:adminId, :name, :description)`,
      { adminId, name, description }
    );

    await connection.commit();

    res.status(201).json({ message: 'Department added successfully' });
  } catch (err) {
    console.error('Error adding department:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to add department' });
  } finally {
    if (connection) await connection.close();
  }
};

// Update department
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `UPDATE DEPARTMENTS 
       SET NAME = :name, DESCRIPTION = :description
       WHERE ID = :id`,
      { name, description, id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Department updated successfully' });
  } catch (err) {
    console.error('Error updating department:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to update department' });
  } finally {
    if (connection) await connection.close();
  }
};

// Delete department
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await connectDB();
    
    await connection.execute('BEGIN NULL; END;');

    await connection.execute(
      `DELETE FROM DEPARTMENTS WHERE ID = :id`,
      { id }
    );

    await connection.commit();

    res.status(200).json({ message: 'Department deleted successfully' });
  } catch (err) {
    console.error('Error deleting department:', err);
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to delete department' });
  } finally {
    if (connection) await connection.close();
  }
};
