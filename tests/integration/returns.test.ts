import moment from "moment";
import mongoose from "mongoose";
import request from 'supertest';
import { server } from "../..";
import { Movie } from "../../models/movie";
import { Rental } from "../../models/rental";
import { User } from "../../models/user";

describe('/api/returns', () => {
    let customerId;
    let movieId;
    let rental;
    let movie;
    let token: string; 

    const exec = () => {
        return request(server)
            .post('/api/returns')
            .set('x-auth-token', token)
            .send({ customerId, movieId });
    };

    beforeEach(async () => {
        server;
        customerId = new mongoose.Types.ObjectId();
        movieId = new mongoose.Types.ObjectId();
        token = new User().generateAuthToken();

        movie = new Movie({
            _id: movieId,
            title: '12345',
            dailyRentalRate: 2,
            genre: { name: 'genre1' },
            numberInStock: 10
        });

        await movie.save();

        rental = new Rental({
            customer: {
                _id: customerId,
                name: '12345',
                phone: '12345'
            },
            movie: {
                _id: movieId,
                title: '12345',
                dailyRentalRate: 2
            }
        });

        await rental.save();
    });

    afterEach(async () => {
        await server.close();
        await Rental.collection.deleteMany({});
        await Movie.collection.deleteMany({});
    });

    it('should return 401 if client is not logged in', async () => {
        token = '';
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if customerId is not provided', async () => {
        customerId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 400 if movieId is not provided', async () => {
        movieId = '';
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 404 if no rental found for customer/movie', async () => {
        await Rental.collection.deleteMany({});
        const res = await exec();
        expect(res.status).toBe(404);
    });

    it('should return 400 if return is already processed', async () => {
        rental.dateReturned = new Date();
        await rental.save();
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if we have a valid request', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });

    it('should set the return date if input is valid', async () => {
        const res = await exec();
        const rentalInDb = await Rental.findById(rental._id);
        // cas v tom rentalInDb bude trochu jiny nez ten new Date() zde, proto spocitame difference (ten dostaneme v milisekundach)
        // a rekneme, ze vysledek musi byt mensi nez napr. 10 sekund
        const diff = new Date().valueOf() - (rentalInDb?.dateReturned ?? new Date()).valueOf();
        expect(diff).toBeLessThan(10 * 1000);
    });

    it('should set the rentalFee if input is valid', async () => {
        // rental fee bude numberOfDays * dailyRentalFee. Problem je, ze pri tomhle testovani to dateOut a dateReturned 
        // budou mit mezi sebou jen cca 1 sekundu, proto nastavime pomoci knihovny moment (neco jako date fns) ten dateOut o 7 dni dozadu:
        rental.dateOut = moment().add(-7, 'days').toDate(); // moment() nam da momentalni cas a pak odecteme 7 dni
        await rental.save();
        const res = await exec();
        const rentalInDb = await Rental.findById(rental._id);
        expect(rentalInDb?.rentalFee).toBe(14); // 14 protoze mame 7 dni jako pocet dni pujceni a nastavili jsme f t ebeforeEach funkci dailyRentalRate na 2.
    });

    it('should increase movie stock if input is valid', async () => {
        const res = await exec();
        const movieInDb = await Movie.findById(movieId);
        expect(movieInDb?.numberInStock).toBe(movie.numberInStock +1);
    });

    it('should return the rental if input is valid', async () => {
        const res = await exec();
        // const rentalInDb = await Rental.findById(rental._id);
        // expect(res.body).toMatchObject(rentalInDb); // tohle nam fainulo, protoze rentalInDb ma date typu Date, zatimco res.body ma stejnou property typu string (je to json)
        expect(Object.keys(res.body ?? {}))
            .toEqual(expect.arrayContaining(['dateOut', 'dateReturned', 'rentalFee', 'customer', 'movie']));
    });
})