const connectDB = require('../db/connection');
const oracledb = require('oracledb');

// Get all lab tests
exports.getAllLabTests = async (req, res) => {
  try {
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, test_name, description, price, department, preparation_required, 
              duration_minutes, TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
       FROM lab_tests ORDER BY created_at DESC`
    );
    await connection.close();

    const labTests = result.rows.map(row => ({
      id: row[0],
      testName: row[1],
      description: row[2],
      price: row[3],
      department: row[4],
      preparationRequired: row[5],
      durationMinutes: row[6],
      createdAt: row[7]
    }));

    res.json({ success: true, labTests });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab tests' });
  }
};

// Get single lab test
exports.getLabTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, test_name, description, price, department, preparation_required, duration_minutes
       FROM lab_tests WHERE id = :id`,
      [id]
    );
    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    const row = result.rows[0];
    const labTest = {
      id: row[0],
      testName: row[1],
      description: row[2],
      price: row[3],
      department: row[4],
      preparationRequired: row[5],
      durationMinutes: row[6]
    };

    res.json({ success: true, labTest });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab test' });
  }
};

// Add new lab test
exports.addLabTest = async (req, res) => {
  try {
    const { testName, description, price, department, preparationRequired, durationMinutes } = req.body;

    if (!testName || !price) {
      return res.status(400).json({ success: false, message: 'Test name and price are required' });
    }

    const connection = await connectDB();
    const result = await connection.execute(
      `INSERT INTO lab_tests (test_name, description, price, department, preparation_required, duration_minutes)
       VALUES (:testName, :description, :price, :department, :preparationRequired, :durationMinutes)
       RETURNING id INTO :id`,
      {
        testName,
        description: description || null,
        price,
        department: department || null,
        preparationRequired: preparationRequired || null,
        durationMinutes: durationMinutes || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    await connection.close();

    res.status(201).json({ 
      success: true, 
      message: 'Lab test added successfully',
      id: result.outBinds.id[0]
    });
  } catch (error) {
    console.error('Error adding lab test:', error);
    res.status(500).json({ success: false, message: 'Failed to add lab test' });
  }
};

// Update lab test
exports.updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { testName, description, price, department, preparationRequired, durationMinutes } = req.body;

    const connection = await connectDB();
    const result = await connection.execute(
      `UPDATE lab_tests 
       SET test_name = :testName, description = :description, price = :price,
           department = :department, preparation_required = :preparationRequired,
           duration_minutes = :durationMinutes, updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        testName,
        description: description || null,
        price,
        department: department || null,
        preparationRequired: preparationRequired || null,
        durationMinutes: durationMinutes || null,
        id
      },
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.json({ success: true, message: 'Lab test updated successfully' });
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ success: false, message: 'Failed to update lab test' });
  }
};

// Delete lab test
exports.deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `DELETE FROM lab_tests WHERE id = :id`,
      [id],
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    res.json({ success: true, message: 'Lab test deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lab test' });
  }
};
