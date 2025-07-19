import { Request, Response } from "express";
import cloudinary from "../utils/cloudinary.js";
import { Menu } from "../model/Menumodel.js";
import { Category } from "../model/Categorymodel.js";

// Add a new menu item with image upload
export const addMenu = async (req: Request, res: Response) => {
  try {
    const { name, description, price, category, type, isAvailable } = req.body;

    // Validate all required fields including the image
    if (!name || !description || !price || !category || !type || !req.file) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // Check if the category exists
    const foundCategory = await Category.findById(category);
    if (!foundCategory) {
      return res.status(404).json({ message: "Category does not exist." });
    }

    // Upload image to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "menus" },
      async (error, result) => {
        if (error || !result) {
          return res.status(500).json({ message: "Image upload failed", error });
        }
        try {
          const menu = new Menu({
            name,
            description,
            price,
            image: result.secure_url,
            category,
            type,
            isAvailable: isAvailable !== undefined ? isAvailable : true,
          });
          await menu.save();
          res.status(201).json({ message: "Menu item created", menu });
        } catch (saveErr) {
          res.status(500).json({ message: "Failed to save menu item", error: saveErr });
        }
      }
    );

    (uploadStream as NodeJS.WritableStream).end(req.file.buffer);

  } catch (err) {
    res.status(500).json({ message: "Internal server error", error: err });
  }
};

// Get all menu items, with category populated
export const getAllMenus = async (req: Request, res: Response) => {
  try {
    const menus = await Menu.find().populate("category").sort({ createdAt: -1 });
    res.status(200).json({ menus });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch menus", error: err });
  }
};

// Get a single menu item by ID, with category populated
export const getMenuById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findById(id).populate("category");
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }
    res.status(200).json({ menu });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch menu", error: err });
  }
};
