import { requireAuth } from "@clerk/express";
import User from "../models/User.js";
import { upsertStreamUser } from "../lib/stream.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const auth = req.auth();
      const clerkId = auth?.userId;

      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      const claims = auth?.sessionClaims || {};
      const name =
        claims?.name ||
        [claims?.given_name, claims?.family_name].filter(Boolean).join(" ") ||
        claims?.username ||
        "User";
      const email =
        claims?.email ||
        claims?.email_address ||
        (Array.isArray(claims?.email_addresses) ? claims.email_addresses[0] : undefined) ||
        `${clerkId}@clerk.local`;
      const profileImage = claims?.image_url || "";

      const user = await User.findOneAndUpdate(
        { clerkId },
        { $setOnInsert: { clerkId, name, email, profileImage } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      if (!user) return res.status(404).json({ message: "User not found" });

      // attach user to req
      req.user = user;

      await upsertStreamUser({
        id: clerkId,
        name: user.name,
        image: user.profileImage,
      });

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];