import { QueryBuilder } from "./query/createQuery.js";
 const query = new QueryBuilder();
const result = await query
  .find("User")
  .return("node")
  .execute();

console.log(result)