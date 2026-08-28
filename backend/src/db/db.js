// import { PrismaClient } from '@prisma/client';

// const prismaClientSingleton = () => {
//   return new PrismaClient({
//     log: ['error'],
//   });
// };

// export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
import "dotenv/config";
// import { PrismaClient } from "../../generated/prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma };