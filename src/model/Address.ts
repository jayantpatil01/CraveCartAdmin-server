import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAddress extends Document {
  user: mongoose.Types.ObjectId; // Reference to User _id
  street: string;
  city: string;
  state: string;
  zip?: string;
  country: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const addressSchema: Schema<IAddress> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // removed unique: true to allow multiple addresses
    },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, trim: true, default: null },
    country: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
  }
);

const Address: Model<IAddress> = mongoose.model<IAddress>("Address", addressSchema);

export default Address;
