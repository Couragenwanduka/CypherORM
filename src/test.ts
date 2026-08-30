import { QueryBuilder } from "./query/createQuery.ts";

const result = await new QueryBuilder()
  .findOne("User", { email: "courage@nexora.com" })
  .where("name", "=", "Courage")
  .return("node")
  .execute();

console.dir(result, { depth: null });
