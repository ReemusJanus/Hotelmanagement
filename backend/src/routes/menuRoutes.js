import express from "express";
import * as controller from "../controllers/menuController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postMenu);
router.put("/:id", controller.putMenuid);
router.delete("/:id", controller.deleteMenuid);
router.post("/:id/image", upload.single("image"), controller.postMenuidimage);
router.delete("/:id/image", controller.deleteMenuidimage);

export default router;
