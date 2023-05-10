import mongoose from "mongoose";
import { z } from "zod";

export const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 50
},
    isGold: {
     type: Boolean,
     default:false,
    },
    phone: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 50
        },
}));

const schema = z.object({
    name: z.string().min(5).max(50),
    phone: z.string().min(5).max(50),
    isGold: z.boolean()
  });

export const validateCustomer = (customer: string) => {
    return schema.parse(customer);
  };