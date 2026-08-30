import { Driver, auth, driver } from "neo4j-driver";

export class Database {
  private driver: Driver;

  constructor(uri: string, password: string, username: string) {
    this.driver = driver(uri, auth.basic(username, password));
  }

  session() {
    return this.driver.session();
  }

  async close() {
    return this.driver.close();
  }

  async query(cypher: string, params: Record<string, unknown>) {
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
