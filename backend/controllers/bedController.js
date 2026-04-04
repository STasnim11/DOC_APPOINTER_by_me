const connectDB = require('../db/connection');
const oracledb = require('oracledb');

// Get all beds (using hospital_beds table)
exports.getAllBeds = async (req, res) => {
  try {
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, bed_number, ward_name, bed_type, price_per_day, status, floor_number,
              TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
       FROM hospital_beds ORDER BY id ASC`
    );
    await connection.close();

    const beds = result.rows.map(row => ({
      id: row[0],
      bedNumber: row[1],
      wardName: row[2],
      bedType: row[3],
      pricePerDay: row[4],
      status: row[5],
      floorNumber: row[6],
      createdAt: row[7]
    }));

    res.json({ success: true, beds });
  } catch (error) {
    console.error('Error fetching beds:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch beds' });
  }
};

// Get single bed
exports.getBedById = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `SELECT id, bed_number, ward_name, bed_type, price_per_day, status, floor_number
       FROM hospital_beds WHERE id = :id`,
      [id]
    );
    await connection.close();

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    const row = result.rows[0];
    const bed = {
      id: row[0],
      bedNumber: row[1],
      wardName: row[2],
      bedType: row[3],
      pricePerDay: row[4],
      status: row[5],
      floorNumber: row[6]
    };

    res.json({ success: true, bed });
  } catch (error) {
    console.error('Error fetching bed:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bed' });
  }
};

// Add new bed
exports.addBed = async (req, res) => {
  try {
    const { bedNumber, wardName, bedType, pricePerDay, status, floorNumber } = req.body;

    if (!bedNumber || !wardName || !bedType || !pricePerDay) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bed number, ward name, bed type, and price per day are required' 
      });
    }

    const connection = await connectDB();
    const result = await connection.execute(
      `INSERT INTO hospital_beds (bed_number, ward_name, bed_type, price_per_day, status, floor_number)
       VALUES (:bedNumber, :wardName, :bedType, :pricePerDay, :status, :floorNumber)
       RETURNING id INTO :id`,
      {
        bedNumber,
        wardName,
        bedType,
        pricePerDay,
        status: status || 'available',
        floorNumber: floorNumber || null,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      },
      { autoCommit: true }
    );
    await connection.close();

    res.status(201).json({ 
      success: true, 
      message: 'Bed added successfully',
      id: result.outBinds.id[0]
    });
  } catch (error) {
    console.error('Error adding bed:', error);
    res.status(500).json({ success: false, message: 'Failed to add bed' });
  }
};

// Update bed
exports.updateBed = async (req, res) => {
  try {
    const { id } = req.params;
    const { bedNumber, wardName, bedType, pricePerDay, status, floorNumber } = req.body;

    const connection = await connectDB();
    const result = await connection.execute(
      `UPDATE hospital_beds 
       SET bed_number = :bedNumber, ward_name = :wardName, bed_type = :bedType,
           price_per_day = :pricePerDay, status = :status, floor_number = :floorNumber,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = :id`,
      {
        bedNumber,
        wardName,
        bedType,
        pricePerDay,
        status: status || 'available',
        floorNumber: floorNumber || null,
        id
      },
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    res.json({ success: true, message: 'Bed updated successfully' });
  } catch (error) {
    console.error('Error updating bed:', error);
    res.status(500).json({ success: false, message: 'Failed to update bed' });
  }
};

// Delete bed
exports.deleteBed = async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await connectDB();
    const result = await connection.execute(
      `DELETE FROM hospital_beds WHERE id = :id`,
      [id],
      { autoCommit: true }
    );
    await connection.close();

    if (result.rowsAffected === 0) {
      return res.status(404).json({ success: false, message: 'Bed not found' });
    }

    res.json({ success: true, message: 'Bed deleted successfully' });
  } catch (error) {
    console.error('Error deleting bed:', error);
    res.status(500).json({ success: false, message: 'Failed to delete bed' });
  }
};
