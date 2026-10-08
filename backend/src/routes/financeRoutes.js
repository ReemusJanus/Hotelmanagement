import express from "express";
import * as controller from "../controllers/financeController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postFinance);
router.delete("/:id", controller.deleteFinanceid);

export default router;
