const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create Organization
  const org = await prisma.organization.create({
    data: { name: "Raman's Digital Agency" }
  });

  // 2. Create User
  const user = await prisma.user.create({
    data: {
      email: "raman@dev.com",
      fullName: "Raman Singh Rajpoot",
      passwordHash: "hashed_password_123",
      organizationId: org.id
    }
  });

  // 3. Create Client
  const client = await prisma.client.create({
    data: {
      name: "Acme Corp",
      email: "billing@acme.com",
      phone: "+919999999999",
      customNotes: "Always pay via Bank Transfer on weekends",
      organizationId: org.id
    }
  });

  // 4. Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      amount: 50000,
      dueDate: new Date(),
      status: "PARTIALLY_PAID",
      organizationId: org.id,
      clientId: client.id
    }
  });

  // 5. Create Payment (History)
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amountPaid: 25000,
      method: "UPI",
      paidAt: new Date()
    }
  });

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });