import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt.ts'
import { db } from '../db/connection.ts'
import { users } from '../db/schema.ts'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body

    // Hash password with configurable rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,  // Store hash, not plain text!
        firstName,
        lastName,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })

    // Generate JWT for auto-login
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    })

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      token,  // User is logged in immediately
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}