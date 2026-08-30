import { Database } from "../client.js";

const connectDB = () => {
  const db = new Database(
    "bolt+s://db-fdb85df8.bravo.databases.cognodb.com",
    "33236d774f7afae3cb64f8e2398eede5",
    "cognodb",
  );
  return db;
};

export default connectDB;
