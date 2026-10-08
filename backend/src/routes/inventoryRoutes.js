import express from "express";
import * as controller from "../controllers/inventoryController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postInventory);
router.put("/:id", controller.putInventoryid);
router.post("/:id/movements", controller.postInventoryidmovements);
router.delete("/:id", controller.deleteInventoryid);

export default router;
