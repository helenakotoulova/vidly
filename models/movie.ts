import mongoose from "mongoose";
import { z } from "zod";
import { genreSchema } from "./genre";

export const Movie = mongoose.model('Movies', new mongoose.Schema({
    title: {
      type: String,
      required: true,
      trim: true, 
      minlength: 5,
      maxlength: 255
    },
    genre: {
        type: genreSchema,
        required:true,
    }, 
    numberInStock: { 
      type: Number, 
      required: true,
      min: 0,
      max: 255
    },
    dailyRentalRate: { 
      type: Number, 
      required: true,
      min: 0,
      max: 255
    }
  }));
  
const movieSchema = z.object({
    title: z.string().min(5).max(50),
    genreId: z.string(),  // we want client to only send genreId, so here is only: z.string(), but in the mongodb we will have full genre object
    numberInStock: z.number().min(0),
    dailyRentalRate: z.number().min(0)
});
  
type movieType = z.infer<typeof movieSchema>;
  
export const validateMovie = (movie: movieType) => {
  console.log(movie)
    return movieSchema.parse(movie);
  };