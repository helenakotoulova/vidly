import express from "express";
import { admin } from "../middleware/admin";
import { auth } from "../middleware/auth";
import { validateObjectId } from "../middleware/validateObjectId";
import { Genre, validateGenre } from "../models/genre";

export const genresRouter = express.Router();

// tady pouzivame ten asyncMiddleare, ale museli bychom ho pridat do kazde routy, to je taky takove neprehledne.
// proto si nainstalujeme package: express-async-errors
// puvodne: genresRouter.get("/", asyncMiddleware(async(req, res, next) => {
// po instalovani toho package: 
genresRouter.get("/", async (req, res, next) => {
  const genres = await Genre.find().sort('name');
  res.send(genres);
  //throw new Error('errrrrrrrr');
  //res.send(genres);  
});

// pridame zde xten nas middleware pro validovani object id:
genresRouter.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) return res.status(404).send("Genre was not found");
  res.send(genre);
});

// TADY PRIDAME TU AUTH MIDDLEWARE FUNCTION. middlewary jsou tady optional parameter.
// tzn. kdyz budu chtit pridat novy genre, tak budu muset pridat do headeru validni token. Ten ziskam z /api/users (v postmanovi v res headeru)
genresRouter.post("/", auth, async (req, res) => {
  // postovani novych genres chceme umoznit jen authenticated users. Ale nechceme tohle pridavat do kazde routy,
  // proto to presuneme do auth middlewaru.
  //const token = req.header('x-auth-token');
  // if (!token) return res.status(401).send('User is not authen.')
  

  let name = "";
  try {
    name = validateGenre(req.body).name;
  } catch (e) {
    res.status(400).send("Error:" + e.issues[0].message);
  }
  const newGenre = new Genre({
    name,
  });
  const genre = await newGenre.save();
  res.send(genre);
});

// DELETOVANI UMOZNIME JEN ADMINOVI - TZN. NEJDRIV POTRBEUJEME AUTH MIDDLEWARE A PAK ADMIN MIDDLEWARE.
genresRouter.delete("/:id",[auth, admin], async (req, res) => {
  const genre = await Genre.findByIdAndDelete(req.params.id);
  if (!genre) return res.status(404).send("Genre was not found");
  res.send(genre);
});

genresRouter.put("/:id", async (req, res) => {
  let name = "";
  try {
    name = validateGenre(req.body).name;
  } catch (e) {
    res.status(500).send("Error:" + e.issues[0].message);
  }
  const genre = await Genre.findByIdAndUpdate(req.params.id, {
    name,
  }, {
    new: true
  });
  
  if (!genre) return res.status(404).send("Genre was not found");

  res.send(genre);
});


