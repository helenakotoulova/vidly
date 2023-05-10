import request from 'supertest';
import { server } from "../..";
import { Genre } from '../../models/genre';
import { User } from '../../models/user';

describe('auth middleware', () => {
    let token: string; 
    const exec = () => {
        return request(server)
            .post('/api/genres')
            .set('x-auth-token', token)
            .send({ name: 'genre1' });
    }

    beforeEach(() => {
        server;
        token = new User().generateAuthToken(); // jde o metodu na instanci te classy
    });
    afterEach(async () => {
        // tady zalezi na poradi:
        await server.close();
        await Genre.collection.deleteMany({});
    });

    it('should return 401 if no token is provided', async () => {
        token = ''
        const res = await exec();
        expect(res.status).toBe(401);
    });

    it('should return 400 if token is invalid', async () => {
        token = 'a'; // nebo napr. null - to se pak konvertuje na string
        const res = await exec();
        expect(res.status).toBe(400);
    });

    it('should return 200 if token is valid', async () => {
        const res = await exec();
        expect(res.status).toBe(200);
    });

})