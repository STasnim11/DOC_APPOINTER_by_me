// const connectDB = require("../db/connection");

// const validDays = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday"
// ];

// const isValidTime = (time) => {
//   return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
// };
// const timeToMinutes = (time) => {
//   const [hours, minutes] = time.split(":").map(Number);
//   return hours * 60 + minutes;
// };

// const minutesToTime = (totalMinutes) => {
//   const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
//   const minutes = String(totalMinutes % 60).padStart(2, "0");
//   return `${hours}:${minutes}`;
// };

// const generateAppointmentSlots = (startTime, endTime, intervalMinutes = 25) => {
//   const slots = [];
//   let current = timeToMinutes(startTime);
//   const end = timeToMinutes(endTime);
//   const interval = parseInt(intervalMinutes) || 25; // Default 25 minutes if not provided

//   while (current + interval <= end) {
//     slots.push({
//       startTime: minutesToTime(current),
//       endTime: minutesToTime(current + interval)
//     });
//     current += interval;
//   }

//   return slots;
// };

// // Get doctors by specialty
// exports.getDoctorsBySpecialty = async (req, res) => {
//   const { specialty } = req.query;

//   if (!specialty) {
//     return res.status(400).json({ error: "Specialty is required" });
//   }

//   let connection;
//   try {
//     connection = await connectDB();

//     const result = await connection.execute(
//       `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
//        FROM DOCTOR d
//        JOIN USERS u ON d.USER_ID = u.ID
//        JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
//        JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
//        WHERE UPPER(s.NAME) = UPPER(:specialty)
//        ORDER BY d.EXPERIENCE_YEARS DESC`,
//       { specialty }
//     );

//     const doctors = result.rows.map(row => ({
//       id: row[0],
//       name: row[1],
//       email: row[2],
//       specialty: row[3],
//       experienceYears: row[4],
//       degrees: row[5]
//     }));

//     res.status(200).json({ doctors });
//   } catch (err) {
//     console.error('Error fetching doctors by specialty:', err);
//     res.status(500).json({ error: 'Failed to fetch doctors' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Get all specialties
// exports.getAllSpecialties = async (req, res) => {
//   console.log('getAllSpecialties called');
//   let connection;
//   try {
//     connection = await connectDB();
//     console.log('Database connected for specialties');

//     const result = await connection.execute(
//       `SELECT ID, NAME, DESCRIPTION
//        FROM SPECIALIZATION
//        ORDER BY NAME`
//     );

//     console.log('Query executed, rows:', result.rows.length);

//     const specialties = result.rows.map(row => ({
//       id: row[0],
//       name: row[1],
//       description: row[2]
//     }));

//     console.log('Specialties:', specialties);
//     res.status(200).json({ specialties });
//   } catch (err) {
//     console.error('Error fetching specialties:', err);
//     console.error('Error stack:', err.stack);
//     res.status(500).json({ error: 'Failed to fetch specialties' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Get all doctors
// exports.getAllDoctors = async (req, res) => {
//   let connection;
//   try {
//     connection = await connectDB();

//     const result = await connection.execute(
//       `SELECT DISTINCT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
//        FROM DOCTOR d
//        JOIN USERS u ON d.USER_ID = u.ID
//        LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
//        LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
//        ORDER BY d.EXPERIENCE_YEARS DESC`
//     );

//     const doctors = result.rows.map(row => ({
//       id: row[0],
//       name: row[1],
//       email: row[2],
//       specialty: row[3] || 'General',
//       experienceYears: row[4],
//       degrees: row[5]
//     }));

//     res.status(200).json({ doctors });
//   } catch (err) {
//     console.error('Error fetching all doctors:', err);
//     res.status(500).json({ error: 'Failed to fetch doctors' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Get top doctors by appointment count
// exports.getTopDoctors = async (req, res) => {
//   let connection;
//   try {
//     connection = await connectDB();

//     const result = await connection.execute(
//       `SELECT 
//           d.ID as DOCTOR_ID,
//           u.NAME as DOCTOR_NAME,
//           u.EMAIL as DOCTOR_EMAIL,
//           d.DEGREES,
//           d.EXPERIENCE_YEARS,
//           d.FEES,
//           s.NAME as SPECIALTY,
//           COUNT(da.ID) as TOTAL_APPOINTMENTS
//        FROM DOCTOR d
//        JOIN USERS u ON d.USER_ID = u.ID
//        LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
//        LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
//        LEFT JOIN DOCTORS_APPOINTMENTS da ON d.ID = da.DOCTOR_ID
//        WHERE u.ROLE = 'DOCTOR'
//        GROUP BY d.ID, u.NAME, u.EMAIL, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, s.NAME
//        ORDER BY TOTAL_APPOINTMENTS DESC, u.NAME ASC
//        FETCH FIRST 10 ROWS ONLY`
//     );

//     const doctors = result.rows.map(row => ({
//       id: row[0],
//       name: row[1],
//       email: row[2],
//       degrees: row[3],
//       experienceYears: row[4],
//       fees: row[5],
//       specialty: row[6] || 'General',
//       totalAppointments: row[7]
//     }));

//     res.status(200).json({ doctors });
//   } catch (err) {
//     console.error('Error fetching top doctors:', err);
//     res.status(500).json({ error: 'Failed to fetch top doctors' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Get single doctor details
// exports.getDoctorById = async (req, res) => {
//   const { doctorId } = req.params;

//   let connection;
//   try {
//     connection = await connectDB();

//     const result = await connection.execute(
//       `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
//        FROM DOCTOR d
//        JOIN USERS u ON d.USER_ID = u.ID
//        LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
//        LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
//        WHERE d.ID = :doctorId`,
//       { doctorId }
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'Doctor not found' });
//     }

//     const row = result.rows[0];
//     const doctor = {
//       id: row[0],
//       name: row[1],
//       email: row[2],
//       specialty: row[3] || 'General',
//       experienceYears: row[4],
//       degrees: row[5],
//       fee: 50
//     };

//     res.status(200).json({ doctor });
//   } catch (err) {
//     console.error('Error fetching doctor details:', err);
//     res.status(500).json({ error: 'Failed to fetch doctor details' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// // Get doctor's existing schedule
// exports.getDoctorSchedule = async (req, res) => {
//   const { email } = req.params;

//   console.log("Get doctor schedule request for:", email);

//   if (!email) {
//     return res.status(400).json({ error: "❌ Email is required" });
//   }

//   let connection;
//   try {
//     connection = await connectDB();

//     // Get doctor ID
//     const userResult = await connection.execute(
//       `SELECT ID FROM USERS 
//        WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
//          AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
//       { email }
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "❌ Doctor not found" });
//     }

//     const userId = userResult.rows[0][0];

//     const doctorResult = await connection.execute(
//       `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
//       { userId }
//     );

//     if (doctorResult.rows.length === 0) {
//       return res.status(404).json({ error: "❌ Doctor profile not found" });
//     }

//     const doctorId = doctorResult.rows[0][0];

//     // Get all time slots for this doctor
//     const slotsResult = await connection.execute(
//       `SELECT DAY_OF_WEEK, START_TIME, END_TIME
//        FROM TIME_SLOTS
//        WHERE DOCTOR_ID = :doctorId
//        ORDER BY 
//          CASE DAY_OF_WEEK
//            WHEN 'Sunday' THEN 1
//            WHEN 'Monday' THEN 2
//            WHEN 'Tuesday' THEN 3
//            WHEN 'Wednesday' THEN 4
//            WHEN 'Thursday' THEN 5
//            WHEN 'Friday' THEN 6
//            WHEN 'Saturday' THEN 7
//          END,
//          START_TIME`,
//       { doctorId }
//     );

//     console.log(`Found ${slotsResult.rows.length} time slots for doctor`);

//     // Group slots by day and calculate interval
//     const daySchedules = {};
    
//     slotsResult.rows.forEach(row => {
//       const day = row[0];
//       const startTime = row[1];
//       const endTime = row[2];
      
//       if (!daySchedules[day]) {
//         daySchedules[day] = {
//           slots: [],
//           startTime: startTime,
//           endTime: endTime
//         };
//       }
      
//       daySchedules[day].slots.push({ startTime, endTime });
      
//       // Update overall start/end times
//       if (startTime < daySchedules[day].startTime) {
//         daySchedules[day].startTime = startTime;
//       }
//       if (endTime > daySchedules[day].endTime) {
//         daySchedules[day].endTime = endTime;
//       }
//     });

//     // Calculate interval from first two slots of first day
//     let calculatedInterval = 30; // default
//     const firstDay = Object.keys(daySchedules)[0];
//     if (firstDay && daySchedules[firstDay].slots.length >= 2) {
//       const slot1Start = timeToMinutes(daySchedules[firstDay].slots[0].startTime);
//       const slot1End = timeToMinutes(daySchedules[firstDay].slots[0].endTime);
//       const slot2Start = timeToMinutes(daySchedules[firstDay].slots[1].startTime);
//       // Interval is the duration of one slot
//       calculatedInterval = slot1End - slot1Start;
//     }

//     // Build schedule object for frontend
//     const schedule = {};
//     validDays.forEach(day => {
//       if (daySchedules[day]) {
//         schedule[day] = {
//           selected: true,
//           startTime: daySchedules[day].startTime,
//           endTime: daySchedules[day].endTime,
//           interval: calculatedInterval
//         };
//       } else {
//         schedule[day] = {
//           selected: false,
//           startTime: '09:00',
//           endTime: '17:00',
//           interval: 30
//         };
//       }
//     });

//     console.log("Returning schedule:", schedule);

//     res.json({ 
//       success: true,
//       schedule,
//       totalSlots: slotsResult.rows.length
//     });

//   } catch (err) {
//     console.error('Error fetching doctor schedule:', err);
//     res.status(500).json({ error: '❌ Failed to fetch schedule' });
//   } finally {
//     if (connection) await connection.close();
//   }
// };

// exports.saveDoctorSchedule = async (req, res) => {
//   const { email, schedule } = req.body;

//   console.log("Save doctor schedule request received:", { email, schedule });

//   if (!email || !schedule) {
//     return res.status(400).json({ error: "❌ Email and schedule are required" });
//   }

//   let connection;

//   try {
//     connection = await connectDB();
//     console.log("Connected to database");

    
//     const userResult = await connection.execute(
      
//       `SELECT ID FROM USERS 
//    WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
//      AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
//       { email }
//     );

//     if (userResult.rows.length === 0) {
//       return res.status(404).json({ error: "❌ Doctor user not found" });
//     }

//     const userId = userResult.rows[0][0];
//     console.log("Doctor user found, USERS.ID =", userId);

    
//     const doctorResult = await connection.execute(
//       `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
//       { userId }
//     );

//     if (doctorResult.rows.length === 0) {
//       return res.status(404).json({ error: "❌ Doctor profile not found" });
//     }

//     const doctorId = doctorResult.rows[0][0];
//     console.log("Doctor profile found, DOCTOR.ID =", doctorId);

//     // Delete ALL existing time slots for this doctor
//     // Note: Existing appointments will remain valid even if their time slots are deleted
//     // Appointments are independent records that just reference the slot ID
   
//     // Step 1: Null out references in appointments first
// await connection.execute(
//   `UPDATE DOCTORS_APPOINTMENTS 
//    SET TIME_SLOT_ID = NULL
//    WHERE TIME_SLOT_ID IN (
//      SELECT ID FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId
//    )`,
//   { doctorId }
// );

// // Step 2: Now delete slots safely
// const deleteResult = await connection.execute(
//   `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
//   { doctorId }
// );

// console.log("Old schedule deleted - removed", deleteResult.rowsAffected, "slots");
    
//     console.log("Note: Existing appointments are preserved and will still show in dashboards");

//     let totalSlotsCreated = 0;
    
//     for (const day of Object.keys(schedule)) {
//       const dayData = schedule[day];

//       if (!validDays.includes(day)) {
//         await connection.rollback();
//         return res.status(400).json({ error: `❌ Invalid day: ${day}` });
//       }

//       if (dayData.selected) {
//         const { startTime, endTime, interval } = dayData;

//         if (!startTime || !endTime) {
//           await connection.rollback();
//           return res.status(400).json({
//             error: `❌ Start time and end time are required for ${day}`
//           });
//         }

//         if (!isValidTime(startTime) || !isValidTime(endTime)) {
//           await connection.rollback();
//           return res.status(400).json({
//             error: `❌ Invalid time format for ${day}. Use HH:MM in 24-hour format`
//           });
//         }

//         if (startTime >= endTime) {
//           await connection.rollback();
//           return res.status(400).json({
//             error: `❌ Start time must be earlier than end time for ${day}`
//           });
//         }

//         // Use provided interval or default to 25 minutes
//         const appointmentInterval = interval || 25;
//         const slots = generateAppointmentSlots(startTime, endTime, appointmentInterval);
        
//         console.log(`📅 ${day}: Generated ${slots.length} slots from ${startTime} to ${endTime} (${appointmentInterval} min intervals)`);

//         for (const slot of slots) {
//           await connection.execute(
//             `INSERT INTO TIME_SLOTS
//               (ID, START_TIME, END_TIME, STATUS, DOCTOR_ID, DAY_OF_WEEK)
//              VALUES
//               (TIME_SLOTS_SEQ.NEXTVAL, :startTime, :endTime, :status, :doctorId, :day)`,
//             {
//               startTime: slot.startTime,
//               endTime: slot.endTime,
//               status: "AVAILABLE",
//               doctorId,
//               day
//             }
//           );
//           totalSlotsCreated++;
//         }

        
//       }
//     }

//     await connection.commit();
//     console.log("Doctor schedule saved successfully");

//     return res.status(200).json({
//       message: `✅ Doctor schedule saved successfully! Created ${totalSlotsCreated} appointment slots.`,
//       slotsCreated: totalSlotsCreated
//     });
//   } catch (err) {
//     console.error("Save schedule error:", err);

//     if (connection) {
//       try {
//         await connection.rollback();
//         console.log("Transaction rolled back");
//       } catch (rollbackErr) {
//         console.error("Rollback error:", rollbackErr);
//       }
//     }

//     return res.status(500).json({ error: "❌ Failed to save doctor schedule" });
//   } finally {
//     if (connection) {
//       await connection.close();
//       console.log("Database connection closed");
//     }
//   }
// };


// module.exports = exports;
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

// Get doctors by specialty
exports.getDoctorsBySpecialty = async (req, res) => {
  const { specialty } = req.query;

  if (!specialty) {
    return res.status(400).json({ error: "Specialty is required" });
  }

  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       WHERE UPPER(s.NAME) = UPPER(:specialty)
       ORDER BY d.EXPERIENCE_YEARS DESC`,
      { specialty }
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3],
      experienceYears: row[4],
      degrees: row[5]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching doctors by specialty:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get all specialties
exports.getAllSpecialties = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT ID, NAME, DESCRIPTION
       FROM SPECIALIZATION
       ORDER BY NAME`
    );

    const specialties = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2]
    }));

    res.status(200).json({ specialties });
  } catch (err) {
    console.error('Error fetching specialties:', err);
    res.status(500).json({ error: 'Failed to fetch specialties' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get all doctors
exports.getAllDoctors = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT DISTINCT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       ORDER BY d.EXPERIENCE_YEARS DESC`
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3] || 'General',
      experienceYears: row[4],
      degrees: row[5]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching all doctors:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get top doctors by appointment count
exports.getTopDoctors = async (req, res) => {
  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT 
          d.ID as DOCTOR_ID,
          u.NAME as DOCTOR_NAME,
          u.EMAIL as DOCTOR_EMAIL,
          d.DEGREES,
          d.EXPERIENCE_YEARS,
          d.FEES,
          s.NAME as SPECIALTY,
          COUNT(da.ID) as TOTAL_APPOINTMENTS
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       LEFT JOIN DOCTORS_APPOINTMENTS da ON d.ID = da.DOCTOR_ID
       WHERE u.ROLE = 'DOCTOR'
       GROUP BY d.ID, u.NAME, u.EMAIL, d.DEGREES, d.EXPERIENCE_YEARS, d.FEES, s.NAME
       ORDER BY TOTAL_APPOINTMENTS DESC, u.NAME ASC
       FETCH FIRST 10 ROWS ONLY`
    );

    const doctors = result.rows.map(row => ({
      id: row[0],
      name: row[1],
      email: row[2],
      degrees: row[3],
      experienceYears: row[4],
      fees: row[5],
      specialty: row[6] || 'General',
      totalAppointments: row[7]
    }));

    res.status(200).json({ doctors });
  } catch (err) {
    console.error('Error fetching top doctors:', err);
    res.status(500).json({ error: 'Failed to fetch top doctors' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get single doctor details
exports.getDoctorById = async (req, res) => {
  const { doctorId } = req.params;

  let connection;
  try {
    connection = await connectDB();

    const result = await connection.execute(
      `SELECT d.ID, u.NAME, u.EMAIL, s.NAME as SPECIALIZATION_NAME, d.EXPERIENCE_YEARS, d.DEGREES
       FROM DOCTOR d
       JOIN USERS u ON d.USER_ID = u.ID
       LEFT JOIN DOC_SPECIALIZATION ds ON d.ID = ds.DOCTOR_ID
       LEFT JOIN SPECIALIZATION s ON ds.SPECIALIZATION_ID = s.ID
       WHERE d.ID = :doctorId`,
      { doctorId }
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    const row = result.rows[0];
    const doctor = {
      id: row[0],
      name: row[1],
      email: row[2],
      specialty: row[3] || 'General',
      experienceYears: row[4],
      degrees: row[5],
      fee: 50
    };

    res.status(200).json({ doctor });
  } catch (err) {
    console.error('Error fetching doctor details:', err);
    res.status(500).json({ error: 'Failed to fetch doctor details' });
  } finally {
    if (connection) await connection.close();
  }
};

// Get doctor's existing schedule
exports.getDoctorSchedule = async (req, res) => {
  const { email } = req.params;

  console.log("Get doctor schedule request for:", email);

  if (!email) {
    return res.status(400).json({ error: "❌ Email is required" });
  }

  let connection;
  try {
    connection = await connectDB();

    const userResult = await connection.execute(
      `SELECT ID FROM USERS 
       WHERE TRIM(LOWER(EMAIL)) = TRIM(LOWER(:email))
         AND TRIM(UPPER(ROLE)) = 'DOCTOR'`,
      { email }
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor not found" });
    }

    const userId = userResult.rows[0][0];

    const doctorResult = await connection.execute(
      `SELECT ID FROM DOCTOR WHERE USER_ID = :userId`,
      { userId }
    );

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({ error: "❌ Doctor profile not found" });
    }

    const doctorId = doctorResult.rows[0][0];

    const slotsResult = await connection.execute(
      `SELECT DAY_OF_WEEK, START_TIME, END_TIME
       FROM TIME_SLOTS
       WHERE DOCTOR_ID = :doctorId
       ORDER BY 
         CASE DAY_OF_WEEK
           WHEN 'Sunday' THEN 1
           WHEN 'Monday' THEN 2
           WHEN 'Tuesday' THEN 3
           WHEN 'Wednesday' THEN 4
           WHEN 'Thursday' THEN 5
           WHEN 'Friday' THEN 6
           WHEN 'Saturday' THEN 7
         END,
         START_TIME`,
      { doctorId }
    );

    console.log(`Found ${slotsResult.rows.length} time slots for doctor`);

    if (slotsResult.rows.length === 0) {
      const emptySchedule = {};
      validDays.forEach(day => {
        emptySchedule[day] = {
          selected: false,
          startTime: '09:00',
          endTime: '17:00',
          interval: 30
        };
      });
      return res.json({ success: true, schedule: emptySchedule, totalSlots: 0 });
    }

    const daySchedules = {};

    slotsResult.rows.forEach(row => {
      const day = row[0];
      const startTime = row[1];
      const endTime = row[2];

      if (!daySchedules[day]) {
        daySchedules[day] = { slots: [], startTime, endTime };
      }

      daySchedules[day].slots.push({ startTime, endTime });

      if (startTime < daySchedules[day].startTime) {
        daySchedules[day].startTime = startTime;
      }
      if (endTime > daySchedules[day].endTime) {
        daySchedules[day].endTime = endTime;
      }
    });

    let calculatedInterval = 30;
    const firstDay = Object.keys(daySchedules)[0];
    if (firstDay && daySchedules[firstDay].slots.length >= 1) {
      const slot1Start = timeToMinutes(daySchedules[firstDay].slots[0].startTime);
      const slot1End = timeToMinutes(daySchedules[firstDay].slots[0].endTime);
      calculatedInterval = slot1End - slot1Start;
    }

    const schedule = {};
    validDays.forEach(day => {
      if (daySchedules[day]) {
        schedule[day] = {
          selected: true,
          startTime: daySchedules[day].startTime,
          endTime: daySchedules[day].endTime,
          interval: calculatedInterval
        };
      } else {
        schedule[day] = {
          selected: false,
          startTime: '09:00',
          endTime: '17:00',
          interval: 30
        };
      }
    });

    res.json({ success: true, schedule, totalSlots: slotsResult.rows.length });

  } catch (err) {
    console.error('Error fetching doctor schedule:', err);
    res.status(500).json({ error: '❌ Failed to fetch schedule' });
  } finally {
    if (connection) await connection.close();
  }
};

// Save/Update doctor schedule
exports.saveDoctorSchedule = async (req, res) => {
  const { email, schedule } = req.body;

  console.log("Save doctor schedule request received for:", email);

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

    // Safe to delete all slots — appointments now store times independently
    const deleteResult = await connection.execute(
      `DELETE FROM TIME_SLOTS WHERE DOCTOR_ID = :doctorId`,
      { doctorId }
    );
    console.log("Old schedule deleted - removed", deleteResult.rowsAffected, "slots");

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
    console.log("Doctor schedule saved successfully -", totalSlotsCreated, "slots created");

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

    return res.status(500).json({ error: "❌ Failed to save doctor schedule: " + err.message });
  } finally {
    if (connection) {
      await connection.close();
      console.log("Database connection closed");
    }
  }
};

module.exports = exports;