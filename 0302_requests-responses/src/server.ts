import express from 'express'

const app = express()

app.get('/health', (req, res) => {
  res.json({ message: "hello" }).status(200)
})

app.post('/cake', (req, res) => {
  res.send('ok')
})

export { app }

export default app