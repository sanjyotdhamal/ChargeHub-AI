import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, verifyPassword, hashPassword, checkRateLimit } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ChangePasswordSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Rate limiting (10 attempts per 15 min per IP)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = checkRateLimit(ip, "password-change", 10, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many password change attempts. Please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const parseResult = ChangePasswordSchema.safeParse(body);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string" && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      return NextResponse.json(
        { error: "Validation failed", fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parseResult.data;

    await connectDB();
    const user = await User.findById(authUser.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Current password is incorrect", fieldErrors: { currentPassword: "Incorrect password" } },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    user.passwordHash = newHash;
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("POST /api/profile/password error:", error);
    return NextResponse.json(
      { error: "Something went wrong, please try again" },
      { status: 500 }
    );
  }
}
