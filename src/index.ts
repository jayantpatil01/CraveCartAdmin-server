import express, { application } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import categoryRoutes from "./route/categoryRoutes.js";
import adminRoutes from './route/adminRoutes.js';
import menuRoutes from './route/menuRoutes.js';
import cartRoutes from './route/cartRoutes.js';
import orderRoutes from './route/orderRoutes.js';
import addressRoutes from './route/addressRoutes.js'

const app = express();
app.use(cors());
app.use(express.json());



app.use("/api", categoryRoutes);
app.use("/api", adminRoutes);
app.use("/api",menuRoutes);
app.use("/api",cartRoutes);
app.use("/api",orderRoutes);
app.use("/api",addressRoutes);

const PORT = process.env.PORT ;
const URL = process.env.MONGO_URL;

if (!URL) {
  throw new Error("MONGO_URL is not set in .env");
}
if (!PORT) {
  throw new Error("PORT is not set in .env");
}

mongoose.connect(URL)
  .then(() => {
    console.log("✅ Database connected");              
    app.listen(PORT, () => {
      console.log(`🚀 Server started on port: ${PORT}`); 
    });
  })
  .catch((err) => {
    console.log("❌ Database connection failed", err);   
  });
