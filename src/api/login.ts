import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs'; // For password comparison
import { db } from '../db'; // Import the Kysely setup

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Query the database for the user by username
    const user = await db.selectFrom('users')
      .select(['user_id', 'username', 'password', 'email', 'notes', 'message'])
      .where('username', '=', username)
      .executeTakeFirst();

    // If user doesn't exist, return error
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Compare password with the hashed password in the database
    const validPassword = bcrypt.compareSync(password, user.password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Respond with user details (excluding password)
    return res.status(200).json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      notes: user.notes,
      message: user.message,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
}
