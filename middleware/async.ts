import { Handler, NextFunction, Request, Response } from "express";

// tohle uz nepotrebujeme. nyni pouzivame express-async-errors
export function asyncMiddleware (handler: Handler) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req,res, () => {});
        } catch (e) {
            next(e);
      }
  }
};
