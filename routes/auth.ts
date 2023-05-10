import bcrypt from "bcrypt";
import express from "express";
import { z } from "zod";
import { User } from "../models/user";

export const authRouter = express.Router();

// tenhle router je pro logging in. Router v users.ts (usersRouter) je pro vytvareni noveho usera.
authRouter.post("/", async(req, res) => {
    let user = {
        email: '',
        password: ''
    };
    
  try {
      const {  email, password } = validateUser(req.body);
      user = {
          email,
          password
      }
  } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
    }

    const foundUser = await User.findOne({ email: user.email });
    if (!foundUser) return res.status(400).send('Invalid email or password.');
    
    const validPassword = await bcrypt.compare(user.password, foundUser.password);
    if (!validPassword) return res.status(400).send('Invalid email or password.');
    
    // zde posilame Json Web Token:
    // To authenticate a user, a client application must send a JSON Web Token(JWT) in the authorization header 
    // of the HTTP request to your backend API.API Gateway validates the token on behalf of your API, so you don't 
    // have to add any code in your API to process the authentication.
    // pokud vyvijeme appku v reactu nebo angularu, muzeme ten token ulozit do localstorage.
    // Takhle to bylo puvodne:
    //const token = jwt.sign({ _id: foundUser._id }, config.get('jwtPrivateKey')); // pouzijeme config a custom-environment-variables.json pro namapovani
    // toho jwtPrivateKey. Ten si nastavime jako env, takze to nebude nikde ulozene tady v aplikaci.
  const token = foundUser.generateAuthToken();
    res.send(token);    
});

const schema = z.object({
    email: z.string().min(5).max(255).email(),
    password:z.string().min(5).max(1024),
  });
  
export const validateUser = (user: string) => {
    return schema.parse(user);
  };