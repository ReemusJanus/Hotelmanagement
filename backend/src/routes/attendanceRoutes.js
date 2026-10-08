import express from "express";
import * as controller from "../controllers/attendanceController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.get("/:id", controller.getAttendanceid);
router.post("/:id/check-in", controller.postAttendanceidcheckin);
router.post("/:id/check-out", controller.postAttendanceidcheckout);

export default router;
