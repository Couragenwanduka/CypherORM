import { Driver, auth, driver as createDriver } from "neo4j-driver";
import QueryBuilderError from "./error/QueryBuilderError.ts";


export interface DatabaseConfig {
  uri:string;
  password:string;
  username:string
}

export class Database {
  private driver: Driver;
  private connected = false;

  constructor(config:DatabaseConfig) {
    if(!config.password || !config.uri ||!config.username){
       throw new QueryBuilderError( "Database requires uri, username, and password to connect.")
    }
    this.driver = createDriver(config.uri, auth.basic(config.username, config.password));
  }

  async connect(){
    try{
       await this.driver.verifyConnectivity();
      this.connected = true;

    }catch(error){
      throw new QueryBuilderError(`Failed to connect to the database: ${(error as Error).message}`,)
    }
  }

   private ensureConnected() {
    if (!this.connected) {
      throw new QueryBuilderError(
        "Database is not connected. Call connect() before running queries.",
      );
    }
  }
  session() {
    this.ensureConnected()
    return this.driver.session();
  }

  async close() {
    return this.driver.close();
  }

  async query(cypher: string, params: Record<string, unknown>) {
    this.ensureConnected();
    const session = this.session();

    try {
      const result = await session.run(cypher, params);

      return result.records.map((record) => {
        const values = record.toObject();

        return Object.fromEntries(
          Object.entries(values).map(([key, value]) => {
            if (value && typeof value === "object" && "properties" in value) {
              return [key, (value as { properties: unknown }).properties];
            }

            return [key, value];
          }),
        );
      });
    } finally {
      await session.close();
    }
  }
}
