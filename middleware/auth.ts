import config from "config";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    // dale musime verfikovat ten token
    try {
        const decoded = jwt.verify(token, config.get("jwtPrivateKey")); // dostaneme tohle: { _id: this._id }, viz ta fce generateAuthToken v user.ts
        // nepustilo me to takhle: req.user = ..., ale takhle to funguje:
        req['user'] = decoded;
        next();
    } catch (e) {
        // 400 - bad request
        res.status(400).send('Invalid token.')
    }
};

// tedka bychom to bud mohli aplikovat na vsechny routy - v index.ts bychom pridali: app.use(auth)
// nebo jen nekde.Nekde to urcite nechceme(napr.pri registrovani usera). - ale pridame to napr. do postovaci routy v genres.
