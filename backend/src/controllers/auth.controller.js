import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

export const register = async (req, res) => {
  try {
    const { organizationName, email, password, fullName } = req.body;
    if (!organizationName || !email || !password || !fullName) {
      return res.status(400).json({ error: 'organizationName, email, password and fullName are required' });
    }

    // create organization
    const org = await prisma.organization.create({ data: { name: organizationName} });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        organizationId: org.id
      }
    });

    const token = jwt.sign({ userId: user.id, organizationId: org.id, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, organizationId: org.id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });
   console.log("checking...")
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, organizationId: user.organizationId, email: user.email }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(200).json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, organizationId: user.organizationId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

export default { register, login };
