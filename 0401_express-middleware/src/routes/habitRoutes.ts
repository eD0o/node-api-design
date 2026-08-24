import { Router } from "express";

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'habits' })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'got one habbit' })
})

router.post('/', (req, res) => {
  res.json({ message: 'created habbit' }).status(201)
})

router.delete('/:id', (req, res) => {
  res.json({ message: 'deleted habbit' })
})

router.post('/:id/complete', (req, res) => {
  res.json({ message: 'completed habbit' }).status
})

export default router