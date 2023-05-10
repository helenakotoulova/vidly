import bcrypt from "bcrypt";
import express from "express";

import _ from "lodash";
import { auth } from "../middleware/auth";
import { User, validateUser } from "../models/user";

// tenhle router je pro vytvareni noveho usera. Router authRouter je pro logging in.
export const usersRouter = express.Router();

// getting the current user.
// normalne nedavame /:id, abychom neposilali nejake secure info jako token apod., proto se vetsinou delat endpoint /me
// to auth zde nebude jako autentifikace ale autorizace
usersRouter.get('/me', auth, async (req, res) => {  // tzn. cela route je: /api/users/me
  // to id uzivatele nedostaneme z routy, ale z requestu:
  const user = await User.findById(req['user']._id).select('-password'); // excludovani passwordu. ten uzivateli nechceme posilat.
  res.send(user);
})

usersRouter.post("/", async(req, res) => {
    let user = {
        name: '',
        email: '',
        password: ''
    };
    
  try {
      const { name, email, password } = validateUser(req.body);
      user = {
          name,
          email,
          password
      }
  } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
    }


  const foundUser = await User.findOne({ email: user.email });
  if (foundUser) return res.status(404).send('User is already registered.');

  const newUser = new User(user);
  const salt = await bcrypt.genSalt(10); // $2b$10$mt0jyEDVAGGrBpi09etcqe  // jsou to proste nejake vygenerovane znaky
  newUser.password = await bcrypt.hash(newUser.password, salt); // ten salt se pak hodi pred to heslo. Na to heslo se pak posle hashovaci fce.
  await newUser.save();

  // tuhle funkci ale ted mame v users.ts a auth.ts, ale to neni dobre, protoze tam budeme chtit pridat napr. user.name a museli bychom to menit na dvou mistech,
  // proto tu funkci pridame jako metodu do user objectu.
  //const token = jwt.sign({ _id: newUser._id }, config.get('jwtPrivateKey'));
  
  // pridame header do response (headery jdou pridavat nejen do requestu, ale i do responsu), tzn. uzivatel se zaregistruje a rovnou prihlasi.
  res.header('x-auth-token', newUser.generateAuthToken()).send(_.pick(user, ['name', 'email']));// nechceme uzivateli posilat i password. proto vybereme jen name a email.
    
  // na logging out user nepotrebujeme special routu, staci nam tahle. Token totiz nestorujeme na serveru (to by byl bad practice, protoze kdyby se hacker dostal do te databaze,
  // tak by videl vsechny ty tokeny. Slo by je zahashovat, ale i tak je lepsi to tam neukladat). Token mame ulozeny jen u clienta, pro odhlaseni by tedy stacilo ten token smazat.
});