import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/api-response";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await UserModel.find().sort({
      createdAt: -1,
    });

    return sendSuccess(res, users);
  } catch (error) {
    return sendError(res, {
      code: "SERVER_ERROR",
      message: "Server error",
    }, 500);
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

    return sendSuccess(res, updatedUser);
  } catch (error) {
    return sendError(res, {
      code: "UPDATE_FAILED",
      message: "Update failed",
    }, 500);
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

    return sendSuccess(res, updatedUser);
  } catch (error) {
    return sendError(res, {
      code: "UPDATE_FAILED",
      message: "Update failed",
    }, 500);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // ⛔ Không cho phép xóa bất kỳ user nào có role "admin"
    const target = await UserModel.findById(id).select("role").lean();
    if (!target) {
      return sendError(res, {
        code: "USER_NOT_FOUND",
        message: "Không tìm thấy người dùng.",
      }, 404);
    }
    if (target.role === "admin") {
      return sendError(res, {
        code: "FORBIDDEN",
        message: "Không thể xóa tài khoản có quyền Admin.",
      }, 403);
    }

    await UserModel.findByIdAndDelete(id);

    return sendSuccess(res, { message: "Đã xóa người dùng thành công." });
  } catch (error) {
    return sendError(res, {
      code: "DELETE_FAILED",
      message: "Xóa thất bại.",
    }, 500);
  }
};
