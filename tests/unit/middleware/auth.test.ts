import mongoose from "mongoose";
import { auth } from "../../../middleware/auth";
import { User } from "../../../models/user";

// protoze pomoci knihovny supertest nemuzeme destrukturovat req object, musime pro tohle napsat unit test.
// chceme otestovat, ze ten decoded token se ulozi do req.user
describe('auth middleware', () => {
    it('should populate req.user with the payload of a valid JWT', () => {
        const user = { _id: new mongoose.Types.ObjectId().toHexString(), isAdmin: true };
        const token = new User(user).generateAuthToken();

        // musime namockovat req,res, next:
        const req = {
            header: jest.fn().mockReturnValue(token)
        } as any; // musela jsem zde dat as any, aby to nervalo v tom volani fce auth

        const res = {} as any;
        const next = jest.fn();

        auth(req, res, next);

        expect(req.user).toMatchObject(user);
    })
})