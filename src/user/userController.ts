import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //   console.log("Req Body: ", req.body);

  const { name, email, password } = req.body;

  //validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  //search in database if this email already exists
  const user = await userModel.findOne({ email });
  if (user) {
    const error = createHttpError(400, "User already exists with this email");
    return next(error);
  }

  //hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  //store this in database
  const newUser = await userModel.create({
    name,
    email,
    password: hashedPassword,
  });

  //token generation
  const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
    expiresIn: "7d",
    algorithm: "HS256",
  });

  res.json({
    accessToken: token,
  });
};

// const loginUser = (req: Request, res: Response, next: NextFunction) => {
//     const {email, password} =
// }

export { createUser };
