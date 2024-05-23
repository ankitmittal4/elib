import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization");
  if (!token) {
    return next(createHttpError(401, "Authorization token is required"));
  }
  const parsedToken = token.split(" ")[1];

  try {
    const decodedToken = jwt.verify(parsedToken, config.jwtSecret as string);
    const _req = req as AuthRequest;
    _req.userId = decodedToken.sub as string;
    console.log("Decoded Token: ", decodedToken);
  } catch (error) {
    return next(createHttpError(401, "Token expired"));
  }

  next();
};

export default authenticateUser;
