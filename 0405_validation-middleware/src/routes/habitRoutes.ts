import { Router } from "express";
import { validateBody } from "../middleware/validation.ts";
import { z } from 'zod';

const createHabitSchema = z.object({
  name: z.string()
})

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'habits' })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'got one habbit' })
})

router.post('/', validateBody(createHabitSchema), (req, res) => {
  res.json({ message: 'created habbit' }).status(201)
})

router.delete('/:id', (req, res) => {
  res.json({ message: 'deleted habbit' })
})

router.post('/:id/complete', (req, res) => {
  res.json({ message: 'completed habbit' }).status
})

export default router