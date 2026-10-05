// ZapTI Database Seed
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@zapti/shared/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Read credentials from environment variables with defaults for development
  const superadminEmail = process.env.SEED_SUPERADMIN_EMAIL || 'admin@zapti.local';
  const superadminPassword = process.env.SEED_SUPERADMIN_PASSWORD || 'admin123456';
  const demoAdminEmail = process.env.SEED_DEMO_ADMIN_EMAIL || 'admin@demo.local';
  const demoAdminPassword = process.env.SEED_DEMO_ADMIN_PASSWORD || 'demo123456';
  const demoAgentPassword = process.env.SEED_DEMO_AGENT_PASSWORD || 'demo123456';
  const demoTenantName = process.env.SEED_DEMO_TENANT_NAME || 'Empresa Demo';

  let superadmin = await prisma.user.findUnique({
    where: { email: superadminEmail },
  });

  if (!superadmin) {
    const passwordHash = await hashPassword(superadminPassword);

    superadmin = await prisma.user.create({
      data: {
        email: superadminEmail,
        name: 'Super Admin',
        passwordHash,
        isSuperadmin: true,
      },
    });

    console.log(`✅ Superadmin created: ${superadminEmail}`);
  } else {
    console.log('ℹ️ Superadmin already exists');
  }

  // Ensure superadmin variable is set
  if (!superadmin) {
    throw new Error('Superadmin not found after creation/lookup');
  }

  // Create demo tenant
  let demoTenant = await prisma.tenant.findFirst({ where: { name: demoTenantName } });
  if (!demoTenant) {
    demoTenant = await prisma.tenant.create({
      data: {
        name: demoTenantName,
        settings: JSON.stringify({
          appearance: {
            primaryColor: '#3B82F6',
            companyName: 'Empresa Demo',
          },
          notifications: {
            pushEnabled: true,
            soundEnabled: true,
          },
        }),
        ownerId: superadmin.id,
      },
    });
  }

  console.log(`✅ Demo tenant: ${demoTenant.name}`);

  // Create demo admin user
  let demoAdmin = await prisma.user.findUnique({ where: { email: demoAdminEmail } });
  if (!demoAdmin) {
    const passwordHash = await hashPassword(demoAdminPassword);
    demoAdmin = await prisma.user.create({
      data: {
        email: demoAdminEmail,
        name: 'Admin Demo',
        passwordHash,
        isSuperadmin: false,
      },
    });
    console.log(`✅ Demo admin created: ${demoAdminEmail}`);
  }

  // Link demo admin to demo tenant
  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: demoAdmin.id, tenantId: demoTenant.id } },
    update: { role: 'ADMIN', permissions: JSON.stringify([]) },
    create: { userId: demoAdmin.id, tenantId: demoTenant.id, role: 'ADMIN', permissions: JSON.stringify([]) },
  });

  // Link superadmin to demo tenant (owner)
  await prisma.userTenant.upsert({
    where: { userId_tenantId: { userId: superadmin.id, tenantId: demoTenant.id } },
    update: { role: 'OWNER', permissions: JSON.stringify(['*']) },
    create: { userId: superadmin.id, tenantId: demoTenant.id, role: 'OWNER', permissions: JSON.stringify(['*']) },
  });

  // Create default team
  const defaultTeam = await prisma.team.upsert({
    where: { id: 'default-team' },
    update: {},
    create: {
      id: 'default-team',
      tenantId: demoTenant.id,
      name: 'Equipe Principal',
      description: 'Equipe padrão da empresa',
      color: '#3B82F6',
    },
  });

  // Add admin to default team
  await prisma.userTeam.upsert({
    where: { userId_teamId: { userId: demoAdmin.id, teamId: defaultTeam.id } },
    update: {},
    create: { userId: demoAdmin.id, teamId: defaultTeam.id },
  });

  // Create demo agents
  const agents = [
    { email: process.env.SEED_AGENT1_EMAIL || 'agent1@demo.local', name: 'Agente João' },
    { email: process.env.SEED_AGENT2_EMAIL || 'agent2@demo.local', name: 'Agente Maria' },
  ];

  for (const agent of agents) {
    let agentUser = await prisma.user.findUnique({ where: { email: agent.email } });
    if (!agentUser) {
      const passwordHash = await hashPassword(demoAgentPassword);
      agentUser = await prisma.user.create({
        data: {
          email: agent.email,
          name: agent.name,
          passwordHash,
          isSuperadmin: false,
        },
      });
      console.log(`✅ Demo agent created: ${agent.email}`);
    }
    await prisma.userTenant.upsert({
      where: { userId_tenantId: { userId: agentUser.id, tenantId: demoTenant.id } },
      update: { role: 'AGENT', permissions: JSON.stringify([]) },
      create: { userId: agentUser.id, tenantId: demoTenant.id, role: 'AGENT', permissions: JSON.stringify([]) },
    });
    await prisma.userTeam.upsert({
      where: { userId_teamId: { userId: agentUser.id, teamId: defaultTeam.id } },
      update: {},
      create: { userId: agentUser.id, teamId: defaultTeam.id },
    });
  }

  // Create WhatsApp instance placeholder
  await prisma.whatsAppInstance.upsert({
    where: { id: 'demo-whatsapp' },
    update: {},
    create: {
      id: 'demo-whatsapp',
      tenantId: demoTenant.id,
      name: 'WhatsApp Demo',
      status: 'DISCONNECTED',
      phoneNumber: '+55 11 99999-9999',
      encryptionKey: 'demo-encryption-key-placeholder',
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });