import { NextFunction, Request, Response } from "express";

export const handleMessageMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const body = req.body;

  const change = body?.entry?.[0]?.changes?.[0]?.value;

  if (!change) {
    return res.sendStatus(400);
  }

  if (change.statuses) {
    const status = change.statuses[0];

    return res.sendStatus(200);
  }

  next();
};
