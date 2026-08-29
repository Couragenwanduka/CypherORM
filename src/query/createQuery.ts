import connectDB from "../utils/connectDB.js";
import QueryBuilderError from "../error/QueryBuilderError.ts";

export class QueryBuilder {
  private clauses: string[] = [];
  private parameters: Record<string, unknown> = {};

  create(label: string, properties: Record<string, unknown>) {
    if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }
    if (Object.keys(properties).length === 0) {
      throw new QueryBuilderError("Properties cannot be empty");
    }
    const props = Object.keys(properties)
      .map((keys) => `${keys}: $${keys}`)
      .join(", ");

    this.clauses.push(`CREATE (node:${label} {${props}})`);

    Object.assign(this.parameters, properties);

    return this;
  }
  find(label:string){
     if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }
        this.clauses.push(`MATCH (node:${label})`);
        return this
    }

  return(variable: string) {
    this.clauses.push(`RETURN ${variable}`);
    return this;
  }
  

  build() {
    if (this.clauses.length === 0) {
      throw new QueryBuilderError("Cannot build an empty query");
    }
    return {
      cypher: this.clauses.join("\n"),
      params: this.parameters,
    };
  }

 async execute() {
  const query = this.build();
  const db = connectDB();

  try {
    return await db.query(query.cypher, query.params);
  } finally {
    await db.close();
  }
}
}
