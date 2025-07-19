import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config()

// Should be stored in env in real app; for demo, hardcoded here.
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "password";
const JWT_SECRET = process.env.JWT_SECRET || "yourjwtsecret"; 

export const adminLogin = (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  // Hardcoded check
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Create JWT token
    const token = jwt.sign(
      { email: ADMIN_EMAIL, role: "admin" },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({ success: true, message: "Login successful.", token });
  } else {
    return res.status(401).json({ success: false, message: "Invalid admin credentials." });
  }
};
export const Hey= (req:Request,res:Response)=>{
  return res.status(200).json({ message: "Hey" });
}
