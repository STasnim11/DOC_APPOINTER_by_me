const oracledb = require("oracledb");

const dbConfig = {
  user: "app",
  password: "App12345",
  connectString: "localhost:31521/FREEPDB1"
};

async function connectDB() {
  return await oracledb.getConnection(dbConfig);
}

module.exports = connectDB;