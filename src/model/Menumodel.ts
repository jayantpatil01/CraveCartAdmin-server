import mongoose, { Schema, Document, Types } from "mongoose";
import { CategoryDocument } from "./Categorymodel.js";

export interface MenuDocument extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  category: Types.ObjectId | CategoryDocument;
  isAvailable: boolean;
  type: "veg" | "non-veg";
}

const MenuSchema = new Schema<MenuDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true }, 
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    isAvailable: { type: Boolean, default: true },
    type: { type: String, enum: ["veg", "non-veg"], required: true }
  },
  { timestamps: true }
);

export const Menu = mongoose.model<MenuDocument>("Menu", MenuSchema);
