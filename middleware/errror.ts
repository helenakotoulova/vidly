import { NextFunction, Request, Response } from "express";
import winston from "winston";

export function error(err: Error, req: Request, res: Response, next: NextFunction) {
    console.log('errorMiddleware')
    // log the exception - pro loggovani erroru je dobre pouzivat napr. knihovnu winston
    // log fce bere error level - error, warn, info, verbose, debug, silly
    //winston.log('error', err.message);
    // nebo to lze zapsat jako:
    winston.error(err.message, err);
    return res.status(500).send('Something failed.')
  }