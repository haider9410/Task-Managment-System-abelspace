import { Router } from "express";
import Profile from "../models/Profile.js";

const router = Router();

const ownerOf = (req) => (req.headers["x-user-id"] || "guest").toString().slice(0, 200);

router.get("/", async (req, res, next) => {
  try {
    const ownerId = ownerOf(req);
    let profile = await Profile.findOne({ ownerId });
    if (!profile) {
      profile = await Profile.create({ ownerId });
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const ownerId = ownerOf(req);
    const allowed = ["email", "name", "title", "username", "picture"];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = String(req.body[key]);
    }
    const profile = await Profile.findOneAndUpdate(
      { ownerId },
      update,
      { upsert: true }
    );
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    await Profile.findOneAndDelete({ ownerId: ownerOf(req) });
    res.json({ message: "Workspace access removed" });
  } catch (err) {
    next(err);
  }
});

export default router;
