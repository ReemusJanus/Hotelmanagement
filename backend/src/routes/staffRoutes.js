import express from "express";
import * as controller from "../controllers/staffController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postStaff);
router.put("/:id", controller.putStaffid);
router.post("/:id/check-in", controller.postStaffidcheckin);
router.post("/:id/check-out", controller.postStaffidcheckout);

export default router;
