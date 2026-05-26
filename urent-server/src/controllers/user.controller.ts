import { Request, Response } from "express";
import { UserModel } from "../models/user.model";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().sort({
      createdAt: -1,
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
    });
  }
};

export const updateTrustScore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { trustScore } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        trustScore,
      },
      {
        new: true,
      },
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({
      message: "Update failed",
    });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        role,
      },
      {
        new: true,
      },
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(updatedUser);
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Role update failed",
    });
  }
};
