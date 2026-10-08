import express from "express";
import * as controller from "../controllers/ordersController.js";
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = express.Router();

router.post("/", controller.postOrders);
router.post("/:id/items", controller.postOrdersiditems);
router.post("/:id/mark-paid", controller.postOrdersidmarkpaid);
router.patch("/:id/status", controller.patchOrdersidstatus);
router.post("/:id/request-bill", controller.postOrdersidrequestbill);
router.get("/:id/bill", controller.getOrdersidbill);
router.post("/:id/finalize", controller.postOrdersidfinalize);

export default router;
