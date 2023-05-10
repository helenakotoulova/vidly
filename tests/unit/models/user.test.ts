import config from "config";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { User } from "../../../models/user";

describe('user.generateAuthToken', () => {
    it('should return a valid JWT', () => {
        const payload = { _id: new mongoose.Types.ObjectId().toHexString(), isAdmin: true };
        const user = new User(payload);
        const token = user.generateAuthToken();
        const decoded = jwt.verify(token, config.get('jwtPrivateKey')); // bylo potreba vytvorit novy soubor test.json ve slozce config. A dat tam nejakou hodnotu toho envu.
        expect(decoded).toMatchObject(payload);
    }) 
})