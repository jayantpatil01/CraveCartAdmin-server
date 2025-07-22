import { Request, Response } from "express";
import Address from "../model/Address.js"; // adjust path as needed
import mongoose from "mongoose";

// Add new address for a user
export const addAddress = async (req: Request, res: Response) => {
  const { userId } = req.params; // get userId from URL param
  const { street, city, state, zip, country } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }

  // Validate required fields
  if (!street || !city || !state || !country) {
    return res.status(400).json({ success: false, message: "Missing required address fields" });
  }

  try {
    // Create new address linked to user
    const newAddress = new Address({
      user: userId,
      street,
      city,
      state,
      zip,
      country,
    });

    await newAddress.save();

    return res.status(201).json({ success: true, message: "Address added successfully", address: newAddress });
  } catch (err) {
    console.error("Error adding address:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
