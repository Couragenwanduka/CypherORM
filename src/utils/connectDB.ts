import { Database } from "../client.js";

const connectDB = () => {
  const db = new Database("", "", "");
  return db;
};

export default connectDB;
