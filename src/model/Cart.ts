import mongoose, { Document, Schema, Types } from "mongoose";

export interface ICartItem {
  item: Types.ObjectId; // Reference to Menu item
  quantity: number;
}

export interface ICart extends Document {
  user: {
    id: Types.ObjectId;
    name: string;
  };
  items: ICartItem[];
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>(
  {
    item: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const cartSchema = new Schema<ICart>(
  {
    user: {
      id: { type: Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
    },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now },
  }
);

export const Cart = mongoose.model<ICart>("Cart", cartSchema);
