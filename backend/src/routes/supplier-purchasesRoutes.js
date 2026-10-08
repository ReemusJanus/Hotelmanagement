import express from "express";
import * as controller from "../controllers/supplier-purchasesController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postSupplierpurchases);
router.post("/:id/payments", controller.postSupplierpurchasesidpayments);
router.delete("/:id", controller.deleteSupplierpurchasesid);

export default router;
