import mongoose from "mongoose";

export async function dbconnection() {
  try {
    const dbUrl = process.env.DB_URL_LOCAL;
    if (!dbUrl) {
      throw new Error("DB_URL_LOCAL environment variable is not set");
    }
    await mongoose.connect(dbUrl);
    console.log("DataBase Connected Successfully");
  } catch (error) {
    console.error("Database connection error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}