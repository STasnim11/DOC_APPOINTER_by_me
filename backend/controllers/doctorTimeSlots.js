const oracledb = require("oracledb");
const connectDB = require("../db/connection");

// Helper functions
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const generateAppointmentSlots = (startTime, endTime, intervalMinutes = 25) => {
  const slots = [];
  let current = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const interval = parseInt(intervalMinutes) || 25;

  while (current + interval <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + interval)
    });
    current += interval;
  }

  return slots;
};

exports.saveDoctorTimeSlots = async (req, res) => {
  const { email, timeSlots } = req.body;

  console.log("Save doctor time slots request:", { email, timeSlots });

  // ✅ Validate
  if (!email || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    return res.status(400).json({ error: "❌ Email and timeSlots array are required" });
  }

  let connection;
  try {
    connection = await connectDB();

    // 1️⃣ Get doctor ID by email
    const doctorResult = await connection.execute(
      `SELECT d.ID AS doctor_id
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       WHERE TRIM(LOWER(u.EMAIL)) = TRIM(LOWER(:email))`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const doctorId = doctorResult.rows[0].DOCTOR_ID;
    console.log("Doctor ID:", doctorId);

    // 2️⃣ Delete existing time slots for this doctor
    await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );
    console.log("Deleted existing time slots");

    let totalSlotsCreated = 0;

    // 3️⃣ Insert new time slots with interval-based generation
    for (const slot of timeSlots) {
      const { dayOfWeek, startTime, endTime, interval } = slot;
      
      if (!dayOfWeek || !startTime || !endTime) {
        console.log("Skipping invalid slot:", slot);
        continue;
      }

      // Generate multiple slots based on interval
      const appointmentInterval = interval || 25;
      const generatedSlots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
      
      console.log(`Generating ${generatedSlots.length} slots for ${dayOfWeek} from ${startTime} to ${endTime}`);

      for (const genSlot of generatedSlots) {
        await connection.execute(
          `INSERT INTO TIME_SLOTS 
            (DOCTOR_ID, DAY_OF_WEEK, START_TIME, END_TIME, STATUS)
           VALUES
            (:doctorId, :dayOfWeek, :startTime, :endTime, :status)`,
          { 
            doctorId, 
            dayOfWeek, 
            startTime: genSlot.startTime, 
            endTime: genSlot.endTime,
            status: 'AVAILABLE'
          }
        );
        totalSlotsCreated++;
      }
    }

    await connection.commit();
    console.log(`Successfully created ${totalSlotsCreated} time slots`);
    
    res.status(200).json({ 
      message: `✅ Time slots saved successfully! Created ${totalSlotsCreated} appointment slots.`,
      slotsCreated: totalSlotsCreated
    });

  } catch (err) {
    console.error("Error saving doctor time slots:", err);
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    res.status(500).json({ error: "❌ Server error: " + err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
};
