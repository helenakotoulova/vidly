import express from "express";

export const homeRouter = express.Router();

homeRouter.get("/", (req, res) => {
  //res.send("Hello world!");
  // Takhle jsme zkusili, ze funguje logovani tech erroru: 
  throw new Error('Could not get home');
  res.render("index", { title: "My Express App", message: "Hello world!" });
});
