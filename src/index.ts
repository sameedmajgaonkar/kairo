import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./db/schema";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  schema: schema,
});
