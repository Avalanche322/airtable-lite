import * as itemsService from "./service";
import { Request, Response } from "express";

export async function getItems(req: Request, res: Response) {
  try {
    const result = await itemsService.getItems({
      cursor: req.query.cursor as string,
      fetchSize: req.query.fetchSize as string,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
}

export async function createItem(req: Request, res: Response) {
  try {
    const row = await itemsService.createItem(req.body);
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
}

export async function updateItem(req: Request<{ id: number }>, res: Response) {
  try {
    const row = await itemsService.updateItem(req.params.id, req.body);
    if (!row) return res.status(404).json({ error: "not found" });
    res.json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "db error" });
  }
}
