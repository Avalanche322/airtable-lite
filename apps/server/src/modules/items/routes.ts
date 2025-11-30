import { Router } from "express";
import { getItems, createItem, updateItem } from "./controller";

const router = Router();

router.get("/", getItems);
router.post("/", createItem);
router.patch("/:id", updateItem);

export default router;
