import express from "express";
import { auth } from "../middleware/auth";
import { Movie } from "../models/movie";
import { Rental } from "../models/rental";

export const returnsRouter = express.Router();

// pridame auth middleware pro ten prvni test case - 401 - unauthorized
returnsRouter.post("/", auth, async (req, res) => {
    if (!req.body.customerId) return res.status(400).send('customerId not provided');
    if (!req.body.movieId) return res.status(400).send('movieId not provided');

    const rental = await Rental.lookup(req.body.customerId, req.body.movieId); /// staticka metoda
    
    if (!rental) return res.status(404).send('Rental not found.');
    if (rental.dateReturned) return res.status(400).send('Return already processed.');
    
    rental.returnRental();
    await rental.save();

    await Movie.updateOne({ _id: req.body.movieId }, {
        $inc: { numberInStock: 1 }
    })

    return res.send(rental); // puvodne to bylo takhle: return res.status(200).send(rental) ,
    // ale nemusime tam davat ten status 200, protoze express to nastavi by default
});