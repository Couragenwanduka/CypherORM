import { Database, type DatabaseConfig } from "../client.js";
import QueryBuilderError from "../error/QueryBuilderError.ts";

let instance: Database | null = null;

const connectDB = async (config:DatabaseConfig) => {
   if(!config){
    throw new QueryBuilderError( "connectDB() requires a config the first time it's called: { uri, username, password }",)
  }
  if (instance) return instance

   instance = new Database(config);
  await instance.connect();
  return instance;
};

export function getDB() {
  if (!instance) {
    throw new Error("Database not initialized. Call connectDB(config) first.");
  }
  return instance;
}

export default connectDB;
