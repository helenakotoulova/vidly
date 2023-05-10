import config from "config";
import express from "express";
// tohle nam staci importovat, nemusime to ukladat do zadne konstanty apod.
// MUSI TO BYT TADY NAHORE!!!!!!!!!!!!!! PRED IMPORTOVANIM TECH ROUTERU, JINAK TO NEFUNGUJE - viz https://github.com/davidbanham/express-async-errors/issues/33
import "express-async-errors";
import mongoose from "mongoose";
import winston from "winston";
import "winston-mongodb";
import { error } from "./middleware/errror";
import { log } from "./middleware/logger";
import { prod } from "./prod";
import { authRouter } from "./routes/auth";
import { coursesRouter } from "./routes/courses";
import { customersRouter } from "./routes/customers";
import { genresRouter } from "./routes/genres";
import { homeRouter } from "./routes/home";
import { moviesRouter } from "./routes/movies";
import { rentalsRouter } from "./routes/rentals";
import { returnsRouter } from "./routes/returns";
import { usersRouter } from "./routes/users";
var Fawn = require("fawn");

// cely obsah tohoto filu by sel roztridit do separatnich filu viz to video - handling and logging errors - 11-15

// winston pro logovani erroru - pouziva object transport, kde je mozne error vypsat pomoci: console, file, http
// a umoznuje i logovani v mongodb, couchdb, loggly, redis,...
winston.add(new winston.transports.File({ filename: 'logfile.log' }));
// winston pro mongodb:
//winston.add(winston.transports.MongoDB, {db: 'mongodb://localhost:27017/vidlyDB', level: 'info'}) // takhle se tam ulozi vsechny logy pro errory, warningy a info. (verbose, debug, silly ne)

// pokud tady vznikne exception, tak ji winston primo nezachyti. Ten zatim zachytava jen veci, ktere se tykaji primo expressu.
// proto pouzijeme process z nodu a pak winstona  :
process.on('uncaughtException', (ex) => {
  console.log("We got an uncaught exception.");
  //winston.add(new winston.transports.Console({colorize:true}))
  winston.error(ex.message, ex);
  // je dobre exitnout ten process, protoze ten stav nemusi byt uplne clean
  process.exit(1);
})
//throw new Error('Uncaught exception error')

process.on('unhandledRejection', (ex) => {
  console.log("We got an unhandled rejection.");
  winston.error(ex);
  process.exit(1);
});
//const p = Promise.reject(new Error('Something failed.'));
//p.then(() => console.log('Done'));

// misto tech process.on('', ...) to muzeme udelat pomoci winstona:
//winston.handleExceptions(new winston.transports.File({ 'filename': 'uncaughtException.log' }));

console.log(config.get('jwtPrivateKey'))  // nastaveni envu v powershellu: $env:vidly_jwtPrivateKey="mySecureKey"
if (!config.get('jwtPrivateKey')) {
  console.error('FATAL ERROR: jwtPrivateKey is not defined.');
  process.exit(1); // process je nodevovsky objekt. process.exit(0) means success, cokoliv jineho nez 0 je error.
}

const db:string = config.get("db");

mongoose
  .connect(db)  /// nastaveni konkretni db - defaultne se bere z default.json, pro TEST: nastavim v powershellu  $env:NODE_ENV="test", tak z test.json
  .then(() => console.log(`Connected to ${db}...`)) // nebo winston.info(...)
  .catch((e) => console.error(`Could not connect to ${db}`, e));

 // Fawn.init(mongoose);

const startupDebugger = require("debug")("app:startup");
const dbDebugger = require("debug")("app:db");

const app = express();

app.use(express.json());

// template engines:
app.set("view engine", "pug");
app.set("views", "./views"); // default. it is not neccessary here

// custom middleware
app.use(log);

// genres router:
app.use("/api/genres", genresRouter);
// home router:
app.use("/", homeRouter);
// courses router:
app.use("/api/courses", coursesRouter);
// customers router:
app.use("/api/customers", customersRouter);
// movies router:
app.use("/api/movies", moviesRouter);
// rentals router:
app.use("/api/rentals", rentalsRouter);
// users router:
app.use("/api/users", usersRouter);
// auth router:
app.use("/api/auth", authRouter);
// returns router:
app.use("/api/returns",returnsRouter);

// custom middleware pro handlovani erroru. Aplikuje se na vsechny routy.
app.use(error);

// db work:
dbDebugger("Connected to database... ");

if (app.get("env") === "development") {
  //console.log('develompent mode');
  startupDebugger("development mode");
}

// deployovani - funkce prod: - tenhle kod bychom zde mohli mit kondicionalne podle toho, jestli jsme v prod modu nebo ne
prod(app);

const port = process.env.PORT || 3001;
export const server = app.listen(port, () =>
  console.log(`🚀  Aplications Server running at ${port}...`)
);

// console.log("Application name" + config.get("name"));
// console.log("Mail server" + config.get("mail.host"));
// console.log("Password" + config.get("mail.password"));
