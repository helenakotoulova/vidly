import mongoose from 'mongoose';
import request from 'supertest';
import { server } from "../..";
import { Genre } from '../../models/genre';
import { User } from '../../models/user';

describe('/api/genres', () => {
    // we want to close the connection to server after each test and then initialize it again, jinak bychom dostali
    // exception, ze ten server je uz obsazeny
    beforeEach(() => {
        server;
    });
    afterEach(async () => {
        // tady zalezi na poradi:
        await server.close();
        await Genre.collection.deleteMany({});
    })
    describe('GET', () => {
        it('should return all genres', async () => {
             // ale tohle (expect(res.status).toBe(200)) neni dostatecny test, proto udelame populating the db:
            // puvodne jsem to mela az za tim awaitovanim requestu, coz samozrejme nefungovalo spravne. Nejdriv to tam musim insertovat ty genres,
            // pak delam tento request.
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' }
            ]);
            
            const res = await request(server).get('/api/genres');          

            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            // problem je, ze pokud udelame nejakou dalsi zmenu, tak se tam znovu budou insertovat ty 2 genres, takze pak tam uz budou 4, pak 6, atd.,
            // tzn ten test nebude prochazet, protoze predpokladame length 2, proto udelame cleanup a pridame to do afterEach
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
        })
    })

    describe('GET /:id', () => {
        it('should return a genre if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre' });
            await genre.save();
            const res = await request(server).get('/api/genres/' + genre._id);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', genre.name);
        });

        it('should return 404 if invalid id is passed', async () => {
            const res = await request(server).get('/api/genres/1');
            // nejdriv nam to vratilo 500, protoze to nebylo validni id (id = 1). Proto upravime genres router.
            expect(res.status).toBe(404);
        });

        it('should return 404 if no genre with the given id exists', async () => {
            const id = new mongoose.Types.ObjectId();
            const res = await request(server).get('/api/genres/'+ id);
            // nejdriv nam to vratilo 500, protoze to nebylo validni id (id = 1). Proto upravime genres router.
            expect(res.status).toBe(404);
        });
    })

    describe('POST', () => {
        // refactoring the code: describe the positive (ok - successful) path and then in each test
        // change 1 parameter that clearly aligns with the test name.
        
        let token: string;
        let name: string;
        const exec = async () => {
            return await request(server)
            .post('/api/genres')
            .set('x-auth-token', token) // nastavime header s tokenem
            .send({ name });
        }

        beforeEach(() => {
            // pred kazdym testem nastavime ty parametry na validni hodnoty. V tech testech, ktere maji testovat invalidni
            // paths, akorat ty parametry zmenime.
            token = new User().generateAuthToken();
            name = 'genre1';
        })

        it('should return 401 if client is ont logged in', async () => {
            token = '';
            const res = await exec();
            expect(res.status).toBe(401);
        });

        it('should return 400 if genre is invalid (has less than 5 characters)', async () => {
            name = '1234';
            const res = await exec();            
            expect(res.status).toBe(400);
        });

        it('should return 400 if genre is invalid (has more than 50 characters)', async () => {
            name = new Array(52).join('a'); // takhle se nam vytvori array o 52 prazdnych items, ktere spojime pomoci 'a', tzn 51 mezer se vyplni pomoci 'a'
            const res = await exec();
            expect(res.status).toBe(400);
        });

        it('should save the genre if it is valid', async () => {
            await exec();
            const genre = await Genre.find({ name: 'genre1' });
            expect(genre).not.toBeNull();
        });

        it('should return the genre if it is valid', async () => {
            const res = await exec();     
            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');
        });
    })
})