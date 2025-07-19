import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary.js";
import { Category } from "../model/Categorymodel.js";

// Add a new category with image upload
export const addCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ message: "Name and image file are required" });
    }

    // Upload image buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "categories" },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({ message: "Image upload failed", error });
        }
        const category = new Category({
          name,
          image: result.secure_url,
        });
        await category.save();
        res.status(201).json({ message: "Category created", category });
      }
    );
    (uploadStream as NodeJS.WritableStream).end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};
// Get all categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }); // Newest first
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json({ category });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch category", error: err });
  }
};