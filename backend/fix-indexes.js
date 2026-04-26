import mongoose from "mongoose";
import dotenv from "dotenv";

// Load the .env from the backend root
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndexes() {
  try {
    console.log("Connecting to Database to fix strict indexes...");
    await mongoose.connect(MONGODB_URI, { dbName: "test" }); // Adjust dbName if yours is different

    const db = mongoose.connection.db;

    console.log("Dropping old strict indexes from the 'users' collection...");
    
    // We drop ALL indexes (except _id) so Mongoose can rebuild them from scratch with the new 'sparse: true' rule!
    await db.collection("users").dropIndexes();
    
    console.log("✅ Success! Old indexes deleted.");
    console.log("🟢 You can start your backend server again! Mongoose will automatically rebuild them correctly.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to drop indexes:", error.message);
    process.exit(1);
  }
}

fixIndexes();
