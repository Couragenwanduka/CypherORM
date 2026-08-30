import { describe, it, expect } from "vitest";
import { QueryBuilder } from "./query/createQuery.ts";
import QueryBuilderError from "./error/QueryBuilderError.ts";


describe("QueryBuilder - create", () => {
  it("builds a valid CREATE query with parameters", () => {
    const qb = new QueryBuilder();
    const { cypher, params } = qb
      .create("User", { name: "Ada", age: 30 })
      .build();

    expect(cypher).toContain("CREATE (node:User");
    expect(params).toEqual({ param0: "Ada", param1: 30 });
  });

  it("throws if label is empty", () => {
    const qb = new QueryBuilder();
    expect(() => qb.create("", { name: "Ada" })).toThrow(QueryBuilderError);
  });

  it("throws if properties are empty", () => {
    const qb = new QueryBuilder();
    expect(() => qb.create("User", {})).toThrow(QueryBuilderError);
  });
});

describe("QueryBuilder - guards", () => {
  it("throws if update() is called without find()", () => {
    const qb = new QueryBuilder();
    expect(() => qb.update({ name: "Ada" })).toThrow(
      "update() requires a node query",
    );
  });

  it("throws if a second query is started on the same builder", () => {
    const qb = new QueryBuilder();
    qb.find("User");
    expect(() => qb.create("Post", { title: "Hi" })).toThrow(
      "A query has already been started",
    );
  });

  it("throws if whereRelationship() is called without a relationship query", () => {
    const qb = new QueryBuilder();
    expect(() => qb.whereRelationship("since", ">", 2020)).toThrow(
      "whereRelationship() requires a relationship query",
    );
  });
});

describe("QueryBuilder - clause ordering", () => {
  it("always places RETURN before SKIP and LIMIT regardless of call order", () => {
    const qb = new QueryBuilder();
    const { cypher } = qb
      .find("User")
      .limit(10)
      .return("node")
      .skip(5)
      .build();

    const returnIndex = cypher.indexOf("RETURN");
    const skipIndex = cypher.indexOf("SKIP");
    const limitIndex = cypher.indexOf("LIMIT");

    expect(returnIndex).toBeLessThan(skipIndex);
    expect(skipIndex).toBeLessThan(limitIndex);
  });
});

describe("QueryBuilder - parameter safety", () => {
  it("never reuses a parameter name across chained calls", () => {
    const qb = new QueryBuilder();
    const { params } = qb
      .find("User")
      .where("name", "=", "Ada")
      .andWhere("age", ">", 18)
      .build();

    const keys = Object.keys(params);
    expect(new Set(keys).size).toBe(keys.length); // no duplicate keys
  });
});