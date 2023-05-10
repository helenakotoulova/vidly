import mongoose from "mongoose";
import { z } from "zod";

export const genreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50
  }
});

export const Genre = mongoose.model('Genre', genreSchema);
  
const schema = z.object({
    name: z.string().min(5).max(50),
  });
  
export const validateGenre = (genre: string) => {
    return schema.parse(genre);
  };