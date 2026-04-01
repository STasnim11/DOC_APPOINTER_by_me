const connectDB = require('../db/connection');
const oracledb = require('oracledb');

// Get all medicines
exports.getAllMedicines = async (req, res) => {
  try {
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, name, description, manufacturer, price, stock_quantity, 
              TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, category,
              TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
       FROM medicines ORDER BY created_at DESC`
    );
    await connection.close();

    const medicines = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2],
      manufacturer: row[3],
      price: row[4],
      stockQuantity: row[5],
      expiryDate: row[6],
      category: row[7],
      createdAt: row[8]
    }));

    res.json({ success: true, medicines });
  } catch (error) {
    console.error('Error fetching medicines:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
};

// Get single medicine
exports.getMedicineById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, name, description, manufacturer, price, stock_quantity,
              TO_CHAR(expiry_date, 'YYYY-MM-DD') as expiry_date, category
       FROM medicines WHERE id = :id`,
      [id]
    );
    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const row = result.rows[0];
    const medicine = {
      id: row[0],
      name: row[1],
      description: row[2],
      manufacturer: row[3],
      price: row[4],
      stockQuantity: row[5],
      expiryDate: row[6],
      category: row[7]
    };

    res.json({ success: true, medicine });
  } catch (error) {
    console.error('Error fetching medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch medicine' });
  }
};

// Add new medicine
exports.addMedicine = async (req, res) => {
  try {
    const { name, description, manufacturer, price, stockQuantity, expiryDate, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }

    const connection = await connectDB();
    const result = await connection.execute(
      `INSERT INTO medicines (name, description, manufacturer, price, stock_quantity, expiry_date, category)
       VALUES (:name, :description, :manufacturer, :price, :stockQuantity, TO_DATE(:expiryDate, 'YYYY-MM-DD'), :category)
       RETURNING id INTO :id`,
      {
        name,
        description: description || null,
        manufacturer: manufacturer || null,
        price,
        stockQuantity: stockQuantity || 0,
        expiryDate: expiryDate || null,
        category: category || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    await connection.close();

    res.status(201).json({ 
      success: true, 
      message: 'Medicine added successfully',
      id: result.outBinds.id[0]
    });
  } catch (error) {
    console.error('Error adding medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to add medicine' });
  }
};

// Update medicine
exports.updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manufacturer, price, stockQuantity, expiryDate, category } = req.body;

    const connection = await connectDB();
    const result = await connection.execute(
      `UPDATE medicines 
       SET name = :name, description = :description, manufacturer = :manufacturer,
           price = :price, stock_quantity = :stockQuantity, 
           expiry_date = TO_DATE(:expiryDate, 'YYYY-MM-DD'), category = :category,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        name,
        description: description || null,
        manufacturer: manufacturer || null,
        price,
        stockQuantity: stockQuantity || 0,
        expiryDate: expiryDate || null,
        category: category || null,
        id
      },
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.json({ success: true, message: 'Medicine updated successfully' });
  } catch (error) {
    console.error('Error updating medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to update medicine' });
  }
};

// Delete medicine
exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `DELETE FROM medicines WHERE id = :id`,
      [id],
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    res.json({ success: true, message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error('Error deleting medicine:', error);
    res.status(500).json({ success: false, message: 'Failed to delete medicine' });
  }
};
