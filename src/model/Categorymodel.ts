import mongoose, { Schema, Document } from "mongoose";

export interface CategoryDocument extends Document {
  name: string;
  image: string;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    image: { type: String, required: true }
  },
  { timestamps: true }
);

export const Category = mongoose.model<CategoryDocument>("Category", CategorySchema);
