import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Normalize MySQL SSL config: some connection strings include `ssl=true`
// which the mysql2 driver treats as a boolean and errors. Remove that
// query param and pass an SSL object instead.
const url = new URL(connectionString);
if (url.searchParams.get("ssl") === "true") {
  url.searchParams.delete("ssl");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: url.toString(),
    ssl: { rejectUnauthorized: true },
  },
});
