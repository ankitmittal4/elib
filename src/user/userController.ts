import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel";
import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import { User } from "./userTypes";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  //   console.log("Req Body: ", req.body);

  const { name, email, password } = req.body;

  //validation
  if (!name || !email || !password) {
    const error = createHttpError(400, "All fields are required");
    return next(error);
  }

  //search in database if this email already exists
  try {
    const user = await userModel.findOne({ email });
    if (user) {
      const error = createHttpError(400, "User already exists with this email");
      return next(error);
    }
  } catch (error) {
    const err = createHttpError(500, "Error while getting user");
    return next(err);
  }

  //hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  //store this in database
  let newUser;
  try {
    newUser = await userModel.create({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while creating user"));
  }

  //token generation
  try {
    const token = sign({ sub: newUser._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.status(201).json({
      accessToken: token,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while signing jwt token"));
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(createHttpError(401, "All fields are required"));
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return next(createHttpError(400, "User with this email not exists"));
  }

  //check password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return next(createHttpError(400, "Incorrect Password"));
  }

  try {
    const token = sign({ sub: user._id }, config.jwtSecret as string, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    res.status(201).json({
      accessToken: token,
    });
  } catch (error) {
    return next(createHttpError(500, "Error while signing jwt token"));
  }
};

export { createUser, loginUser };
