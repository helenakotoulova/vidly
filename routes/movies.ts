import express from "express";
import { Genre } from "../models/genre";
import { Movie, validateMovie } from "../models/movie";

export const moviesRouter = express.Router();

moviesRouter.get("/", async (req, res) => {
  const movies = await Movie.find();
  res.send(movies);
});

moviesRouter.get("/:id", async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).send("Movie was not found");
  res.send(movie);
});

moviesRouter.post("/", async(req, res) => {
    let movieInfo = {
        title: '',
        dailyRentalRate: 0,
        genreId: '',
        numberInStock: 0
    };
  try {
      const { title, dailyRentalRate, genreId, numberInStock} = validateMovie(req.body);
      movieInfo = {
          title,
          dailyRentalRate,
          genreId,
          numberInStock
      }
  } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
    }
    
    const genre = await Genre.findById(movieInfo.genreId);
    if (!genre) return res.status(400).send('Invalid genre.');

    const newMovie = new Movie({
        title: movieInfo.title,
        dailyRentalRate: movieInfo.dailyRentalRate,
        numberInStock: movieInfo.numberInStock,
        genre: {
            _id: movieInfo.genreId,
            name: genre.name,
        }
    });
  console.log(newMovie)
  const movie = await newMovie.save();
  res.send(movie);
});
