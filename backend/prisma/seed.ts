import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding OpsFlow ERP v2 production seed...\n');

  const company = await prisma.company.upsert({
    where: { slug: 'opsflow' },
    update: { name: 'OPSFlow Technologies' },
    create: { name: 'OPSFlow Technologies', slug: 'opsflow' }
  });
  console.log(`✅ Company: ${company.name}`);

  const perms = [
    { module: 'user', action: 'view' }, { module: 'user', action: 'create' },
    { module: 'user', action: 'edit' }, { module: 'user', action: 'delete' },
    { module: 'employee', action: 'view' }, { module: 'employee', action: 'create' },
    { module: 'employee', action: 'edit' }, { module: 'employee', action: 'delete' },
    { module: 'asset', action: 'view' }, { module: 'asset', action: 'create' },
    { module: 'asset', action: 'edit' }, { module: 'asset', action: 'delete' },
    { module: 'sim', action: 'view' }, { module: 'sim', action: 'create' },
    { module: 'sim', action: 'edit' }, { module: 'sim', action: 'delete' },
    { module: 'credential', action: 'view' }, { module: 'credential', action: 'edit' },
    { module: 'project', action: 'view' }, { module: 'project', action: 'create' },
    { module: 'project', action: 'edit' }, { module: 'project', action: 'delete' },
    { module: 'task', action: 'view' }, { module: 'task', action: 'create' },
    { module: 'task', action: 'edit' }, { module: 'task', action: 'delete' },
    { module: 'file', action: 'view' }, { module: 'file', action: 'upload' },
    { module: 'file', action: 'delete' },
    { module: 'audit', action: 'view' },
    { module: 'report', action: 'export' },
  ];

  for (const permission of perms) {
    await prisma.permission.upsert({
      where: { module_action: permission },
      update: {},
      create: { ...permission, description: `${permission.action} ${permission.module}s` }
    });
  }

  const allPerms = await prisma.permission.findMany();
  console.log(`✅ Permissions: ${allPerms.length} created`);

  const superAdminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Super Admin' } },
    update: { description: 'Full system access' },
    create: { companyId: company.id, name: 'Super Admin', description: 'Full system access', isSystem: true }
  });

  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Admin' } },
    update: { description: 'Administrative access' },
    create: { companyId: company.id, name: 'Admin', description: 'Administrative access', isSystem: true }
  });

  const teamLeadRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Team Lead' } },
    update: { description: 'Team management access' },
    create: { companyId: company.id, name: 'Team Lead', description: 'Team management access', isSystem: true }
  });

  const employeeRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Employee' } },
    update: { description: 'Basic employee access' },
    create: { companyId: company.id, name: 'Employee', description: 'Basic employee access', isSystem: true }
  });

  for (const permission of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: permission.id }
    });
  }

  const adminPerms = allPerms.filter(p => !['user.delete', 'employee.delete', 'asset.delete', 'sim.delete'].includes(`${p.module}.${p.action}`));
  for (const permission of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id }
    });
  }

  const teamLeadPerms = allPerms.filter(p =>
    ['employee.view', 'asset.view', 'sim.view', 'project.view', 'project.create', 'project.edit', 'task.view', 'task.create', 'task.edit', 'file.view', 'file.upload'].includes(`${p.module}.${p.action}`)
  );
  for (const permission of teamLeadPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: teamLeadRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: teamLeadRole.id, permissionId: permission.id }
    });
  }

  const employeePerms = allPerms.filter(p =>
    ['employee.view', 'project.view', 'task.view', 'task.edit', 'file.view', 'file.upload'].includes(`${p.module}.${p.action}`)
  );
  for (const permission of employeePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: permission.id }
    });
  }

  console.log('✅ Roles: Super Admin, Admin, Team Lead, Employee');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'muhammad.khalid@opsflow.com' },
    update: {
      name: 'Muhammad Khalid',
      roleId: superAdminRole.id,
      companyId: company.id,
      status: 'ACTIVE'
    },
    create: {
      email: 'muhammad.khalid@opsflow.com',
      password: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD || 'Admin@2024', 12),
      name: 'Muhammad Khalid',
      roleId: superAdminRole.id,
      companyId: company.id,
      status: 'ACTIVE'
    }
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log(`\n${'═'.repeat(50)}`);
  console.log('📋 LOGIN CREDENTIALS:');
  console.log(`   Email: ${superAdmin.email}`);
  console.log(`   Password: ${process.env.SUPERADMIN_PASSWORD || 'Admin@2024'}`);
  console.log('   Role: Super Admin (full access)');
  console.log(`${'═'.repeat(50)}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());