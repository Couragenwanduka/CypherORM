import connectDB from "../utils/connectDB.js";
import QueryBuilderError from "../error/QueryBuilderError.ts";

type NodeIdentifier = {
  label: string;
  property: string;
  value: unknown;
};

export class QueryBuilder {
  private clauses: string[] = [];
  private parameters: Record<string, unknown> = {};
  private hasNode = false;
  private hasRelationship = false;
  private hasWhereClause = false;
  private hasReturnClause = false;

  private returnClause?: string;
  private skipClause?: string;
  private limitClause?: string;
  private allowedOperatorList = ["=", ">", "<", ">=", "<=", "<>"];
  private hasStarted = false;

  private parameterCounter = 0;

  private ensureQueryNotStarted() {
    if (this.hasStarted) {
      throw new QueryBuilderError("A query has already been started");
    }
  }

  private createParameter(value: unknown): string {
    const parameterName = `param${this.parameterCounter++}`;

    this.parameters[parameterName] = value;

    return parameterName;
  }


  validateWhere(field: string, operator: string) {
    if (!field.trim()) {
      throw new QueryBuilderError("Field cannot be empty");
    }

    if (!operator.trim()) {
      throw new QueryBuilderError("Operator cannot be empty");
    }

    if (!this.allowedOperatorList.includes(operator)) {
      throw new QueryBuilderError(`${operator} is not an allowed operator`);
    }
  }

  create(label: string, properties: Record<string, unknown>) {
    this.ensureQueryNotStarted();
    if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }
    if (Object.keys(properties).length === 0) {
      throw new QueryBuilderError("Properties cannot be empty");
    }
    const props = Object.entries(properties)
      .map(([key, value]) => {
        const parameterName = this.createParameter(value);
        return `${key}: $${parameterName}`;
      })
      .join(", ");

    this.clauses.push(`CREATE (node:${label} {${props}})`);
    this.hasNode = true;
    this.hasStarted = true;

    return this;
  }

  limit(amount: number) {
    if (amount < 1) {
      throw new QueryBuilderError("Limit must be greater than 0");
    }

    this.limitClause = `LIMIT ${amount}`;

    return this;
  }

  skip(amount: number) {
    if (amount < 0) {
      throw new QueryBuilderError("Skip cannot be negative");
    }

    this.skipClause = `SKIP ${amount}`;

    return this;
  }

  paginate(page: number, pageSize: number) {
    if (page < 1) {
      throw new QueryBuilderError("Page must be greater than 0");
    }

    if (pageSize <= 0) {
      throw new QueryBuilderError("Page size must be greater than 0");
    }

    const offset = (page - 1) * pageSize;

    this.skip(offset);
    this.limit(pageSize);

    return this;
  }
  find(label: string) {
    this.ensureQueryNotStarted();
    if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }
    this.clauses.push(`MATCH (node:${label})`);
    this.hasNode = true;
    this.hasStarted = true;
    return this;
  }

  findOne(label: string, properties: Record<string, unknown>) {
    this.ensureQueryNotStarted();
    if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }
    if (Object.keys(properties).length === 0) {
      throw new QueryBuilderError("Properties cannot be empty");
    }
    const props = Object.entries(properties)
      .map(([key, value]) => {
        const parameterName = this.createParameter(value);
        return `${key}: $${parameterName}`;
      })
      .join(", ");

    this.clauses.push(`MATCH (node:${label} {${props}})`);
    this.hasNode = true;
    this.limit(1);
    this.hasStarted = true;
    return this;
  }
  update(properties: Record<string, unknown>) {
    if (!this.hasNode) {
      throw new QueryBuilderError(
        "update() requires a node query such as find() or findOne()",
      );
    }
    if (Object.keys(properties).length === 0) {
      throw new QueryBuilderError("Properties cannot be empty");
    }

    const props = Object.entries(properties)
      .map(([key, value]) => {
        const parameterName = this.createParameter(value);
        return `node.${key} = $${parameterName}`;
      })
      .join(", ");

    this.clauses.push(`SET ${props}`);

    return this;
  }

  delete() {
    if (!this.hasNode) {
      throw new QueryBuilderError(
        "delete() requires a node query such as find() or findOne()",
      );
    }
    this.clauses.push(`DELETE node`);
    return this;
  }

  detachDelete() {
    if (!this.hasNode) {
      throw new QueryBuilderError(
        "detachDelete() requires a node query such as find() or findOne()",
      );
    }
    this.clauses.push(`DETACH DELETE node`);
    return this;
  }

  where(field: string, operator: string, value: unknown) {
    if (!this.hasNode) {
      throw new QueryBuilderError(
        "where() requires a node query such as find() or findOne()",
      );
    }

    if (this.hasReturnClause) {
      throw new QueryBuilderError("where() cannot be used after return()");
    }

    this.validateWhere(field, operator);

    const parameterName = this.createParameter(value);

    this.clauses.push(`WHERE node.${field} ${operator} $${parameterName}`);

    this.hasWhereClause = true;

    return this;
  }

  andWhere(field: string, operator: string, value: unknown) {
    if (!this.hasWhereClause) {
      throw new QueryBuilderError("andWhere() requires a where() condition");
    }

    if (this.hasReturnClause) {
      throw new QueryBuilderError("andWhere() cannot be used after return()");
    }

    this.validateWhere(field, operator);

    const parameterName = this.createParameter(value);

    this.clauses.push(`AND node.${field} ${operator} $${parameterName}`);

    return this;
  }
  orWhere(field: string, operator: string, value: unknown) {
    if (!this.hasWhereClause) {
      throw new QueryBuilderError("orWhere() requires a where() condition");
    }

    if (this.hasReturnClause) {
      throw new QueryBuilderError("orWhere() cannot be used after return()");
    }

    this.validateWhere(field, operator);

    const parameterName = this.createParameter(value);

    this.clauses.push(`OR node.${field} ${operator} $${parameterName}`);

    return this;
  }
  return(variable: string) {
    if (!variable.trim()) {
      throw new QueryBuilderError("Return variable cannot be empty");
    }

    if (this.hasReturnClause) {
      throw new QueryBuilderError("return() can only be called once");
    }

    this.returnClause = `RETURN ${variable}`;
    this.hasReturnClause = true;

    return this;
  }

  build() {
    if (this.clauses.length === 0) {
      throw new QueryBuilderError("Cannot build an empty query");
    }

    const clauses = [...this.clauses];

    if (this.returnClause) {
      clauses.push(this.returnClause);
    }

    if (this.skipClause) {
      clauses.push(this.skipClause);
    }

    if (this.limitClause) {
      clauses.push(this.limitClause);
    }

    return {
      cypher: clauses.join("\n"),
      params: this.parameters,
    };
  }

  createRelationship(
    node1: NodeIdentifier,
    node2: NodeIdentifier,
    relationship: string,
    properties: Record<string, unknown>,
    direction: string,
  ) {
    this.ensureQueryNotStarted();
    if (!node1.label.trim()) {
      throw new QueryBuilderError("Node 1 label cannot be empty");
    }

    if (!node1.property.trim()) {
      throw new QueryBuilderError("Node 1 property cannot be empty");
    }

    if (!node2.label.trim()) {
      throw new QueryBuilderError("Node 2 label cannot be empty");
    }

    if (!node2.property.trim()) {
      throw new QueryBuilderError("Node 2 property cannot be empty");
    }

    if (!relationship.trim()) {
      throw new QueryBuilderError("Relationship cannot be empty");
    }

    const node1Param = this.createParameter(node1.value);
    const node2Param = this.createParameter(node2.value);

    const relationshipProperties = Object.entries(properties)
      .map(([key, value]) => {
        const parameterName = this.createParameter(value);
        return `relationship.${key} = $${parameterName}`;
      })
      .join(", ");

    if (direction === "OUTGOING") {
      this.clauses.push(`
MATCH (a:${node1.label} {${node1.property}: $${node1Param}})
MATCH (b:${node2.label} {${node2.property}: $${node2Param}})
MERGE (a)-[relationship:${relationship}]->(b)
`);
    } else if (direction === "INCOMING") {
      this.clauses.push(`
MATCH (a:${node1.label} {${node1.property}: $${node1Param}})
MATCH (b:${node2.label} {${node2.property}: $${node2Param}})
MERGE (a)<-[relationship:${relationship}]-(b)
`);
    } else {
      throw new QueryBuilderError("Direction must be OUTGOING or INCOMING");
    }

    if (relationshipProperties) {
      this.clauses.push(`SET ${relationshipProperties}`);
    }

    this.clauses.push(`
RETURN a, relationship, b
`);
    this.hasStarted = true;
    this.hasRelationship = true;

    return this;
  }
  listRelationships(label: string) {
    this.ensureQueryNotStarted();
    if (!label.trim()) {
      throw new QueryBuilderError("Label cannot be empty");
    }

    this.clauses.push(`
    MATCH (node:${label})-[relationship]-(related)
    RETURN node, type(relationship) AS relationshipType, relationship, related
  `);
    this.hasStarted = true;
    this.hasRelationship = true;
  

    return this;
  }
 whereRelationship(field: string, operator: string, value: unknown) {
  if (!this.hasRelationship) {
    throw new QueryBuilderError(
      "whereRelationship() requires a relationship query such as findRelationship() or createRelationship()",
    );
  }
  this.validateWhere(field, operator);

  const parameterName = this.createParameter(value);

  this.clauses.push(
    `WHERE relationship.${field} ${operator} $${parameterName}`,
  );

  return this;
}

  findRelationship(
    node1: NodeIdentifier,
    node2: NodeIdentifier,
    relationship: string,
  ) {
    this.ensureQueryNotStarted();
    if (!node1.label.trim()) {
      throw new QueryBuilderError("Node 1 label cannot be empty");
    }

    if (!node1.property.trim()) {
      throw new QueryBuilderError("Node 1 property cannot be empty");
    }

    if (!node2.label.trim()) {
      throw new QueryBuilderError("Node 2 label cannot be empty");
    }

    if (!node2.property.trim()) {
      throw new QueryBuilderError("Node 2 property cannot be empty");
    }

    if (!relationship.trim()) {
      throw new QueryBuilderError("Relationship cannot be empty");
    }

    const node1Param = this.createParameter(node1.value);
    const node2Param = this.createParameter(node2.value);

    this.clauses.push(`
MATCH (a:${node1.label} {${node1.property}: $${node1Param}})
-[relationship:${relationship}]-
(b:${node2.label} {${node2.property}: $${node2Param}})
`);
    this.hasStarted = true;
    this.hasRelationship = true;

    return this;
  }
  updateRelationship(properties: Record<string, unknown>) {
  if (!this.hasRelationship) {
    throw new QueryBuilderError(
      "updateRelationship() requires a relationship query such as findRelationship() or createRelationship()",
    );
  }
  if (Object.keys(properties).length === 0) {
    throw new QueryBuilderError("Properties cannot be empty");
  }

  const props = Object.entries(properties)
    .map(([key, value]) => {
      const parameterName = this.createParameter(value);
      return `relationship.${key} = $${parameterName}`;
    })
    .join(", ");

  this.clauses.push(`SET ${props}`);

  return this;
}
deleteRelationship() {
  if (!this.hasRelationship) {
    throw new QueryBuilderError(
      "deleteRelationship() requires a relationship query such as findRelationship()",
    );
  }
  this.clauses.push(`
WITH collect(relationship) AS relationships
FOREACH (r IN relationships | DELETE r)
RETURN size(relationships) AS affected
  `);

  return this;
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
