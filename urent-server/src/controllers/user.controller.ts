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
export const updateUserRole = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const { role } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        role,
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

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ⛔ Không cho phép xóa bất kỳ user nào có role "admin"
    const target = await UserModel.findById(id).select("role").lean();
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
    if (target.role === "admin") {
      return res.status(403).json({
        message: "Không thể xóa tài khoản có quyền Admin.",
      });
    }

    await UserModel.findByIdAndDelete(id);

    return res.json({ success: true, message: "Đã xóa người dùng thành công." });
  } catch (error) {
    res.status(500).json({ message: "Xóa thất bại." });
  }
};
