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

  async query(cyher: string, params: {}) {
    const session = this.session();
    try {
      const result = await session.run(cyher, params);
      return result.records.map((record) => {
        const node = record.get("node");
        return node.properties;
      })
    } finally {
      await session.close();
    }
  }


}
