import express from "express";
import { Customer } from "../models/customer";
import { Movie } from "../models/movie";
import { Rental, validateRental } from "../models/rental";
const Fawn = require("fawn");

export const rentalsRouter = express.Router();

rentalsRouter.get("/", async (req, res) => {
  const rentals = await Rental.find().sort('-dateOut');;
  res.send(rentals);
});

rentalsRouter.get("/:id", async (req, res) => {
  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).send("Rental was not found");
  res.send(rental);
});

rentalsRouter.post("/", async(req, res) => {
    let rentalInfo = {
        customerId: '',
        movieId: ''
    };
  try {
      const { customerId, movieId } = validateRental(req.body);
      rentalInfo = {
          customerId,
          movieId
      }
    } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
    }
    
    const customer = await Customer.findById(rentalInfo.customerId);
    if (!customer) return res.status(400).send('Customer was not found.');
    const movie = await Movie.findById(rentalInfo.movieId);
    if (!movie) return res.status(400).send('Movie was not found.');

    if (movie.numberInStock === 0) return res.status(400).send('Movie not in stock.');

    const newRental = new Rental({
        customer: {
            _id: customer._id, // slo by sem hodit celeho customera misto vypisovani jednotlivych properties, ale chceme jen ty nasledujci
            name: customer.name,
            isGold: customer.isGold,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        }
    });
    
    // tohle je group of operations, that all needs to be completed successfully (transaction) - if one of them fails, the whole group of op. should fail
    const rental = await newRental.save();
    movie.numberInStock--;
    movie.save();
    res.send(rental) // v odpovedi uz je dateOut, kde se tam vzal? Mongodb ho tam nedava, to dela mongoose

    // Takhle by to melo byt s tim Fawn, ale nefunguje mi to:
    // try {
    //     new Fawn.Task()
    //     .save('rentals', newRental)
    //     .update('movies', { _id: movie._id }, {
    //         $inc: { numberInStock: -1 }
    //     })
    //     .run()
        
    //     res.send(newRental);
    // } catch (e) {
    //     res.status(500).send('Something failed.')
    // }
   
});
