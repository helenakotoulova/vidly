import { NextFunction, Request, Response } from "express";

// tahle autorizacni fce pobezi po te autentifikacni funkci. Tzn. zde v tom req.user bude ten decoded user.
export const admin = (req: Request, res: Response, next: NextFunction) => {
    // 401 - unathorized - when user tries to access protected resource with not a valid json. We give them a chance to repeat with valid token.
    // vs 403 - forbidden - user provides valid token, but does not have the correct rights to access the resource.
  if (!req['user'].isAdmin) return res.status(403).send('Access denied.') // 403 - forbidden
  next();
};
