import express from "express";
import { saveExpenseTarget, getExpenseTarget, getAllExpenseTargets } from "../controllers/ExpenseTargetController.js";

const router = express.Router();

router.post("/expense-targets", saveExpenseTarget);
router.get("/expense-targets", getExpenseTarget);
router.get("/expense-targets/all", getAllExpenseTargets);

export default router;
