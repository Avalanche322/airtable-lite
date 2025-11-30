import { Router } from "express";
import itemsRoutes from "./modules/items/routes";

const router = Router();

router.use("/items", itemsRoutes);
router.get("/health", (_, res) => res.json({ ok: true }));

export default router;
