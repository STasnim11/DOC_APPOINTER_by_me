const connectDB = require("../db/connection");

const validDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};
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
  const interval = parseInt(intervalMinutes) || 25; // Default 25 minutes if not provided

  while (current + interval <= end) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + interval)
    });
    current += interval;
  }

  return slots;
};

exports.saveDoctorSchedule = async (req, res) => {
  const { email, schedule } = req.body;

  console.log("Save doctor schedule request received:", { email, schedule });

  if (!email || !schedule) {
    return res.status(400).json({ error: "❌ Email and schedule are required" });
  }

  let connection;

  try {
    connection = await connectDB();
    console.log("Connected to database");

    
    const userResult = await connection.execute(
      
      `SELECT ID FROM USERS 
   WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
     AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor user not found" });
    }

    const userId = userResult.rows[0][0];
    console.log("Doctor user found, USERS.ID =", userId);

    
    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];
    console.log("Doctor profile found, DOCTOR.ID =", doctorId);

   
    await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );

    console.log("Old schedule deleted");

    let totalSlotsCreated = 0;
    
    for (const day of Object.keys(schedule)) {
      const dayData = schedule[day];

      if (!validDays.includes(day)) {
        await connection.rollback();
        return res.status(400).json({ error: `❌ Invalid day: ${day}` });
      }

      if (dayData.selected) {
        const { startTime, endTime, interval } = dayData;

        if (!startTime || !endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time and end time are required for ${day}`
          });
        }

        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Invalid time format for ${day}. Use HH:MM in 24-hour format`
          });
        }

        if (startTime >= endTime) {
          await connection.rollback();
          return res.status(400).json({
            error: `❌ Start time must be earlier than end time for ${day}`
          });
        }

        // Use provided interval or default to 25 minutes
        const appointmentInterval = interval || 25;
        const slots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
        
        console.log(`📅 ${day}: Generated ${slots.length} slots from ${startTime} to ${endTime} (${appointmentInterval} min intervals)`);

        for (const slot of slots) {
          await connection.execute(
            `INSERT INTO TIME_SLOTS
              (ID, START_TIME, END_TIME, STATUS, DOCTOR_ID, DAY_OF_WEEK)
             VALUES
              (TIME_SLOTS_SEQ.NEXTVAL, :startTime, :endTime, :status, :doctorId, :day)`,
            {
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: "AVAILABLE",
              doctorId,
              day
            }
          );
          totalSlotsCreated++;
        }

        
      }
    }

    await connection.commit();
    console.log("Doctor schedule saved successfully");

    return res.status(200).json({
      message: `✅ Doctor schedule saved successfully! Created ${totalSlotsCreated} appointment slots.`,
      slotsCreated: totalSlotsCreated
    });
  } catch (err) {
    console.error("Save schedule error:", err);

    if (connection) {
      try {
        await connection.rollback();
        console.log("Transaction rolled back");
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    return res.status(500).json({ error: "❌ Failed to save doctor schedule" });
  } finally {
    if (connection) {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};