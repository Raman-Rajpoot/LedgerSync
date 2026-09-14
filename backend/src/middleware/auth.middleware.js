import jwt from 'jsonwebtoken';
import { prisma } from '../db/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

export const authenticateTenant = async (req, res, next) => {
  try {
    console.log("auth middleware")
    const auth = req.headers.authorization;
    console.log(auth);
    if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization format' });

    const token = parts[1];
    const payload = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });

    req.user = { id: user.id, organizationId: user.organizationId, email: user.email, fullName: user.fullName };
    console.log("auth done")
    next();
  } catch (err) {
    console.error('auth error', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

export default authenticateTenant;
