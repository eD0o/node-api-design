import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import habitRoutes from './routes/habitRoutes.ts'
import userRoutes from './routes/userRoutes.ts'

const app = express()

app.get('/health', (req, res) => {
  res.send('<button>click</button>')
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/habits', habitRoutes)

export { app }

export default app