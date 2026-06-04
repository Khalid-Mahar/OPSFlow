import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding OpsFlow ERP v2...\n');

  // ── Company ──────────────────────────────
  const company = await prisma.company.upsert({
    where: { slug: 'opsflow-demo' },
    update: {},
    create: { name: 'OpsFlow Technologies', slug: 'opsflow-demo' }
  });
  console.log(`✅ Company: ${company.name}`);

  // ── Permissions ───────────────────────────
  const perms = [
    // Users
    { module: 'user', action: 'view' }, { module: 'user', action: 'create' },
    { module: 'user', action: 'edit' }, { module: 'user', action: 'delete' },
    // Employees
    { module: 'employee', action: 'view' }, { module: 'employee', action: 'create' },
    { module: 'employee', action: 'edit' }, { module: 'employee', action: 'delete' },
    // Assets
    { module: 'asset', action: 'view' }, { module: 'asset', action: 'create' },
    { module: 'asset', action: 'edit' }, { module: 'asset', action: 'delete' },
    // SIMs
    { module: 'sim', action: 'view' }, { module: 'sim', action: 'create' },
    { module: 'sim', action: 'edit' }, { module: 'sim', action: 'delete' },
    // Credentials
    { module: 'credential', action: 'view' }, { module: 'credential', action: 'edit' },
    // Projects
    { module: 'project', action: 'view' }, { module: 'project', action: 'create' },
    { module: 'project', action: 'edit' }, { module: 'project', action: 'delete' },
    // Tasks
    { module: 'task', action: 'view' }, { module: 'task', action: 'create' },
    { module: 'task', action: 'edit' }, { module: 'task', action: 'delete' },
    // Files
    { module: 'file', action: 'view' }, { module: 'file', action: 'upload' },
    { module: 'file', action: 'delete' },
    // Audit
    { module: 'audit', action: 'view' },
    // Reports
    { module: 'report', action: 'export' },
  ];

  for (const p of perms) {
    await prisma.permission.upsert({
      where: { module_action: p },
      update: {},
      create: { ...p, description: `${p.action} ${p.module}s` }
    });
  }
  const allPerms = await prisma.permission.findMany();
  console.log(`✅ Permissions: ${allPerms.length} created`);

  // ── Roles ─────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Super Admin' } },
    update: {},
    create: { companyId: company.id, name: 'Super Admin', description: 'Full system access', isSystem: true }
  });

  const adminRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Admin' } },
    update: {},
    create: { companyId: company.id, name: 'Admin', description: 'Administrative access', isSystem: true }
  });

  const teamLeadRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Team Lead' } },
    update: {},
    create: { companyId: company.id, name: 'Team Lead', description: 'Team management access', isSystem: true }
  });

  const employeeRole = await prisma.role.upsert({
    where: { companyId_name: { companyId: company.id, name: 'Employee' } },
    update: {},
    create: { companyId: company.id, name: 'Employee', description: 'Basic employee access', isSystem: true }
  });

  // Assign all permissions to Super Admin
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: perm.id }
    });
  }

  // Admin: all except delete operations
  const adminPerms = allPerms.filter(p => !['user.delete', 'employee.delete', 'asset.delete', 'sim.delete'].includes(`${p.module}.${p.action}`));
  for (const perm of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id }
    });
  }

  // Team Lead: view + create/edit projects/tasks + file upload
  const teamLeadPerms = allPerms.filter(p =>
    ['employee.view', 'asset.view', 'sim.view', 'project.view', 'project.create', 'project.edit', 'task.view', 'task.create', 'task.edit', 'file.view', 'file.upload'].includes(`${p.module}.${p.action}`)
  );
  for (const perm of teamLeadPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: teamLeadRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: teamLeadRole.id, permissionId: perm.id }
    });
  }

  // Employee: view only + task edit + file upload
  const employeePerms = allPerms.filter(p =>
    ['employee.view', 'project.view', 'task.view', 'task.edit', 'file.view', 'file.upload'].includes(`${p.module}.${p.action}`)
  );
  for (const perm of employeePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: employeeRole.id, permissionId: perm.id }
    });
  }
  console.log(`✅ Roles: Super Admin, Admin, Team Lead, Employee`);

  // ── Users ─────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@opsflow.com' },
    update: {},
    create: { email: 'superadmin@opsflow.com', password: await bcrypt.hash('Admin@2024', 12), name: 'Super Administrator', roleId: superAdminRole.id, companyId: company.id, status: 'ACTIVE' }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@opsflow.com' },
    update: {},
    create: { email: 'admin@opsflow.com', password: await bcrypt.hash('Admin@2024', 12), name: 'IT Administrator', roleId: adminRole.id, companyId: company.id, status: 'ACTIVE' }
  });

  const teamLead = await prisma.user.upsert({
    where: { email: 'teamlead@opsflow.com' },
    update: {},
    create: { email: 'teamlead@opsflow.com', password: await bcrypt.hash('Employee@2024', 12), name: 'Ahmed Raza', roleId: teamLeadRole.id, companyId: company.id, status: 'ACTIVE' }
  });

  const sara = await prisma.user.upsert({
    where: { email: 'sara@opsflow.com' },
    update: {},
    create: { email: 'sara@opsflow.com', password: await bcrypt.hash('Employee@2024', 12), name: 'Sara Khan', roleId: employeeRole.id, companyId: company.id, status: 'ACTIVE' }
  });

  const ali = await prisma.user.upsert({
    where: { email: 'ali@opsflow.com' },
    update: {},
    create: { email: 'ali@opsflow.com', password: await bcrypt.hash('Employee@2024', 12), name: 'Ali Hassan', roleId: employeeRole.id, companyId: company.id, status: 'ACTIVE' }
  });

  const fatima = await prisma.user.upsert({
    where: { email: 'fatima@opsflow.com' },
    update: {},
    create: { email: 'fatima@opsflow.com', password: await bcrypt.hash('Employee@2024', 12), name: 'Fatima Malik', roleId: employeeRole.id, companyId: company.id, status: 'ACTIVE' }
  });
  console.log(`✅ Users: 6 created`);

  // ── Employees ─────────────────────────────
  const empAdmin = await prisma.employee.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, companyId: company.id, fullName: 'IT Administrator', designation: 'IT Manager', department: 'IT', phone: '+92-300-1234567', cnic: '35201-1234567-1', address: 'Lahore, Punjab', joiningDate: new Date('2020-01-15'), status: 'ACTIVE' }
  });

  const empTL = await prisma.employee.upsert({
    where: { userId: teamLead.id },
    update: {},
    create: { userId: teamLead.id, companyId: company.id, fullName: 'Ahmed Raza', designation: 'Team Lead - Development', department: 'Development', phone: '+92-301-9876543', cnic: '35202-7654321-2', address: 'Lahore, Punjab', joiningDate: new Date('2021-03-10'), status: 'ACTIVE' }
  });

  const empSara = await prisma.employee.upsert({
    where: { userId: sara.id },
    update: {},
    create: { userId: sara.id, companyId: company.id, fullName: 'Sara Khan', designation: 'Frontend Developer', department: 'Development', phone: '+92-302-5551234', cnic: '35203-1112233-3', address: 'Lahore, Punjab', joiningDate: new Date('2022-06-01'), status: 'ACTIVE' }
  });

  const empAli = await prisma.employee.upsert({
    where: { userId: ali.id },
    update: {},
    create: { userId: ali.id, companyId: company.id, fullName: 'Ali Hassan', designation: 'Backend Developer', department: 'Development', phone: '+92-333-4445566', cnic: '35204-9988776-4', address: 'Islamabad', joiningDate: new Date('2022-09-15'), status: 'ACTIVE' }
  });

  const empFatima = await prisma.employee.upsert({
    where: { userId: fatima.id },
    update: {},
    create: { userId: fatima.id, companyId: company.id, fullName: 'Fatima Malik', designation: 'UI/UX Designer', department: 'Design', phone: '+92-321-6677889', cnic: '35205-3344556-5', address: 'Karachi', joiningDate: new Date('2023-01-20'), status: 'ACTIVE' }
  });
  console.log(`✅ Employees: 5 created`);

  // ── Assets ────────────────────────────────
  const laptop1 = await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-001' } },
    update: {},
    create: { companyId: company.id, assetTag: 'AST-001', category: 'LAPTOP', brand: 'Dell', model: 'Latitude 5530', serialNumber: 'DL5530001', purchaseDate: new Date('2023-01-10'), warrantyExpiry: new Date('2026-01-10'), status: 'ASSIGNED', employeeId: empSara.id, specs: { processor: 'Intel i7', ram: '16GB', storage: '512GB SSD' } }
  });

  const laptop2 = await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-002' } },
    update: {},
    create: { companyId: company.id, assetTag: 'AST-002', category: 'LAPTOP', brand: 'Lenovo', model: 'ThinkPad X1', serialNumber: 'LVX1001', purchaseDate: new Date('2023-03-15'), warrantyExpiry: new Date('2026-03-15'), status: 'ASSIGNED', employeeId: empAli.id, specs: { processor: 'Intel i5', ram: '8GB', storage: '256GB SSD' } }
  });

  await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-003' } },
    update: {},
    create: { companyId: company.id, assetTag: 'AST-003', category: 'MOBILE', brand: 'Samsung', model: 'Galaxy A54', serialNumber: 'SGA54001', purchaseDate: new Date('2023-05-01'), warrantyExpiry: new Date('2025-05-01'), status: 'AVAILABLE' }
  });

  await prisma.asset.upsert({
    where: { companyId_assetTag: { companyId: company.id, assetTag: 'AST-004' } },
    update: {},
    create: { companyId: company.id, assetTag: 'AST-004', category: 'ROUTER', brand: 'TP-Link', model: 'Archer AX73', serialNumber: 'TPAX73001', purchaseDate: new Date('2022-11-20'), warrantyExpiry: new Date('2025-11-20'), status: 'AVAILABLE' }
  });
  console.log(`✅ Assets: 4 created`);

  // ── SIMs ──────────────────────────────────
  const sim1 = await prisma.sim.upsert({
    where: { simNumber: '0300-1112233' },
    update: {},
    create: { companyId: company.id, simNumber: '0300-1112233', network: 'JAZZ', packageName: 'Business Pro 1000', packageCost: 1500, activationDate: new Date('2023-01-01'), expiryDate: new Date('2025-12-31'), employeeId: empTL.id, status: 'active' }
  });

  const sim2 = await prisma.sim.upsert({
    where: { simNumber: '0321-9876543' },
    update: {},
    create: { companyId: company.id, simNumber: '0321-9876543', network: 'ZONG', packageName: 'Data Unlimited', packageCost: 800, activationDate: new Date('2023-06-15'), expiryDate: new Date('2024-07-15'), status: 'active' }
  });
  console.log(`✅ SIMs: 2 created`);

  // ── Cameras ───────────────────────────────
  await prisma.camera.upsert({
    where: { id: 'cam-reception-001' },
    update: {},
    create: { id: 'cam-reception-001', name: 'Reception Camera', location: 'Main Reception - Ground Floor', simId: sim1.id, status: 'active', installationDate: new Date('2023-02-10'), notes: 'HD Camera, 24/7 recording' }
  });

  await prisma.camera.upsert({
    where: { id: 'cam-server-001' },
    update: {},
    create: { id: 'cam-server-001', name: 'Server Room Camera', location: 'Server Room - 2nd Floor', status: 'active', installationDate: new Date('2023-04-05'), notes: 'High security zone' }
  });
  console.log(`✅ Cameras: 2 created`);

  // ── Credentials ───────────────────────────
  const CryptoJS = require('crypto-js');
  const encryptPw = (pw: string) => CryptoJS.AES.encrypt(pw, process.env.ENCRYPTION_KEY || 'opsflow-aes-256-secret-key-32chars!!').toString();

  await prisma.credential.createMany({
    skipDuplicates: true,
    data: [
      { companyId: company.id, platform: 'Google Workspace Admin', category: 'Email', email: 'admin@company.com', username: 'admin', passwordEnc: encryptPw('G00gle@Admin2024'), recoveryEmail: 'backup@gmail.com', tags: ['email', 'google'], notes: 'Main Google Workspace admin account' },
      { companyId: company.id, platform: 'AWS Console', category: 'Cloud', username: 'opsflow-admin', email: 'aws@company.com', passwordEnc: encryptPw('AWS@Secure#2024'), tags: ['cloud', 'aws'], notes: 'Main AWS account' },
      { companyId: company.id, platform: 'GitHub Organization', category: 'Dev Tools', username: 'opsflow-org', email: 'dev@company.com', passwordEnc: encryptPw('GitHub@Org2024!'), tags: ['github', 'dev'], notes: 'Organization account' },
      { companyId: company.id, platform: 'Slack Workspace', category: 'Communication', email: 'admin@company.com', passwordEnc: encryptPw('Slack@2024!'), tags: ['slack', 'communication'] },
    ]
  });
  console.log(`✅ Credentials: 4 created`);

  // ── Projects ──────────────────────────────
  const proj1 = await prisma.project.create({
    data: {
      companyId: company.id, name: 'OpsFlow ERP Development', description: 'Build enterprise resource planning system for internal IT operations management.',
      priority: 'HIGH', status: 'IN_PROGRESS', progress: 65,
      startDate: new Date('2024-01-15'), deadline: new Date('2024-12-31'), managerId: teamLead.id,
      members: { create: [{ userId: teamLead.id, role: 'lead' }, { userId: sara.id, role: 'member' }, { userId: ali.id, role: 'member' }, { userId: fatima.id, role: 'member' }] }
    }
  }).catch(() => null);

  const proj2 = await prisma.project.create({
    data: {
      companyId: company.id, name: 'Company Website Redesign', description: 'Modern redesign of corporate website with improved UX and performance.',
      priority: 'MEDIUM', status: 'PLANNING', progress: 15,
      startDate: new Date('2024-03-01'), deadline: new Date('2024-09-30'), managerId: fatima.id,
      members: { create: [{ userId: fatima.id, role: 'lead' }, { userId: sara.id, role: 'member' }] }
    }
  }).catch(() => null);

  const proj3 = await prisma.project.create({
    data: {
      companyId: company.id, name: 'Mobile App v2.0', description: 'Major update to mobile application with new features and performance improvements.',
      priority: 'CRITICAL', status: 'TESTING', progress: 80,
      startDate: new Date('2023-09-01'), deadline: new Date('2024-06-30'), managerId: ali.id,
      members: { create: [{ userId: ali.id, role: 'lead' }, { userId: sara.id, role: 'member' }] }
    }
  }).catch(() => null);
  console.log(`✅ Projects: 3 created`);

  // ── Milestones ────────────────────────────
  if (proj1) {
    await prisma.milestone.createMany({
      data: [
        { projectId: proj1.id, title: 'Database Schema Design', dueDate: new Date('2024-02-15'), completed: true, completedAt: new Date('2024-02-10'), order: 1 },
        { projectId: proj1.id, title: 'Authentication System', dueDate: new Date('2024-03-01'), completed: true, completedAt: new Date('2024-02-28'), order: 2 },
        { projectId: proj1.id, title: 'Core Modules Backend', dueDate: new Date('2024-05-31'), completed: true, completedAt: new Date('2024-05-28'), order: 3 },
        { projectId: proj1.id, title: 'Frontend Dashboard', dueDate: new Date('2024-08-31'), completed: false, order: 4 },
        { projectId: proj1.id, title: 'Testing & QA', dueDate: new Date('2024-10-31'), completed: false, order: 5 },
        { projectId: proj1.id, title: 'Production Deployment', dueDate: new Date('2024-12-15'), completed: false, order: 6 },
      ]
    });
  }

  // ── Tasks ─────────────────────────────────
  if (proj1) {
    await prisma.task.createMany({
      skipDuplicates: true,
      data: [
        { title: 'Design database schema', description: 'Create complete PostgreSQL schema with all relations and indexes', creatorId: teamLead.id, assigneeId: ali.id, projectId: proj1.id, priority: 'HIGH', status: 'COMPLETED', deadline: new Date('2024-02-15') },
        { title: 'Build JWT authentication', description: 'Implement JWT auth with refresh tokens and RBAC system', creatorId: teamLead.id, assigneeId: ali.id, projectId: proj1.id, priority: 'CRITICAL', status: 'COMPLETED', deadline: new Date('2024-03-01') },
        { title: 'Dashboard UI implementation', description: 'Build responsive React dashboard with Recharts analytics', creatorId: teamLead.id, assigneeId: sara.id, projectId: proj1.id, priority: 'HIGH', status: 'IN_PROGRESS', deadline: new Date('2024-07-30') },
        { title: 'Employee management module', description: 'CRUD operations, profile pages, document uploads', creatorId: teamLead.id, assigneeId: sara.id, projectId: proj1.id, priority: 'HIGH', status: 'IN_PROGRESS', deadline: new Date('2024-08-15') },
        { title: 'Asset tracking system', description: 'Asset management with assignment history tracking', creatorId: teamLead.id, assigneeId: ali.id, projectId: proj1.id, priority: 'MEDIUM', status: 'REVIEW', deadline: new Date('2024-09-01') },
        { title: 'Kanban task board', description: 'Drag-and-drop Kanban with task comments and attachments', creatorId: teamLead.id, assigneeId: sara.id, projectId: proj1.id, priority: 'HIGH', status: 'PENDING', deadline: new Date('2024-09-30') },
        { title: 'Credential vault encryption', description: 'AES-256 encryption for credential storage with access logging', creatorId: teamLead.id, assigneeId: ali.id, projectId: proj1.id, priority: 'CRITICAL', status: 'COMPLETED', deadline: new Date('2024-04-15') },
        { title: 'Write API documentation', description: 'Document all REST API endpoints with request/response examples', creatorId: teamLead.id, assigneeId: ali.id, projectId: proj1.id, priority: 'LOW', status: 'PENDING', deadline: new Date('2024-11-30') },
      ]
    });
  }

  // Standalone tasks (no project)
  await prisma.task.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Server backup verification', description: 'Verify all server backups are running correctly', creatorId: admin.id, assigneeId: ali.id, priority: 'HIGH', status: 'PENDING', deadline: new Date(Date.now() + 2 * 86400000) },
      { title: 'SSL certificate renewal', description: 'Renew SSL certificates for all company domains', creatorId: admin.id, assigneeId: ali.id, priority: 'CRITICAL', status: 'PENDING', deadline: new Date(Date.now() + 5 * 86400000) },
      { title: 'Monthly SIM audit', description: 'Review all SIM cards for expiry and usage', creatorId: admin.id, assigneeId: admin.id, priority: 'MEDIUM', status: 'IN_PROGRESS', deadline: new Date(Date.now() + 3 * 86400000) },
    ]
  });
  console.log(`✅ Tasks: created`);

  // ── Discussions ───────────────────────────
  if (proj1) {
    const disc1 = await prisma.discussion.create({
      data: { projectId: proj1.id, userId: teamLead.id, content: 'Authentication module is complete. Moving on to employee management. @sara please start working on the frontend components.' }
    });
    await prisma.discussionReply.create({
      data: { discussionId: disc1.id, userId: sara.id, content: 'On it! I\'ll start with the employee profile page and table components.' }
    });
    await prisma.discussionReply.create({
      data: { discussionId: disc1.id, userId: ali.id, content: 'Backend APIs for employees are ready. Check the Postman collection I shared.' }
    });
  }

  // ── Todos ─────────────────────────────────
  await prisma.todo.createMany({
    skipDuplicates: true,
    data: [
      { companyId: company.id, userId: admin.id, title: 'Check employee official emails', description: 'Review all company email accounts for any issues', type: 'RECURRING', schedule: 'DAILY', priority: 'HIGH', status: 'PENDING', dueDate: new Date() },
      { companyId: company.id, userId: admin.id, title: 'Verify server backups', description: 'Ensure all automated backups completed successfully', type: 'RECURRING', schedule: 'DAILY', priority: 'CRITICAL', status: 'PENDING', dueDate: new Date() },
      { companyId: company.id, userId: admin.id, title: 'Weekly SIM card audit', description: 'Review all SIM cards, check expiry dates and usage', type: 'RECURRING', schedule: 'WEEKLY', priority: 'MEDIUM', status: 'PENDING' },
      { companyId: company.id, userId: admin.id, title: 'Asset inventory check', description: 'Physical verification of all IT assets', type: 'RECURRING', schedule: 'MONTHLY', priority: 'MEDIUM', status: 'PENDING' },
      { companyId: company.id, userId: admin.id, title: 'Update firewall rules', description: 'Review and update firewall configurations', type: 'ONE_TIME', priority: 'HIGH', status: 'PENDING', dueDate: new Date(Date.now() + 7 * 86400000) },
      { companyId: company.id, userId: teamLead.id, title: 'Sprint planning meeting', description: 'Plan tasks for next 2-week sprint', type: 'RECURRING', schedule: 'WEEKLY', priority: 'HIGH', status: 'PENDING' },
    ]
  });
  console.log(`✅ Todos: 6 created`);

  // ── Tickets ───────────────────────────────
  await prisma.ticket.createMany({
    skipDuplicates: true,
    data: [
      { companyId: company.id, creatorId: sara.id, title: 'Laptop running slowly', description: 'My laptop has been very slow since yesterday. Affecting productivity.', category: 'HARDWARE', priority: 'HIGH', status: 'OPEN', assigneeId: admin.id },
      { companyId: company.id, creatorId: ali.id, title: 'VPN not connecting', description: 'Cannot connect to company VPN from home office.', category: 'NETWORK', priority: 'CRITICAL', status: 'IN_PROGRESS', assigneeId: admin.id },
      { companyId: company.id, creatorId: fatima.id, title: 'Need Adobe Creative Cloud access', description: 'Require Adobe CC subscription for design work.', category: 'SOFTWARE', priority: 'MEDIUM', status: 'OPEN' },
    ]
  });
  console.log(`✅ Tickets: 3 created`);

  // ── Notifications ─────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: sara.id, type: 'TASK_ASSIGNED', title: 'New Task Assigned', message: 'You have been assigned: Dashboard UI implementation', link: '/tasks' },
      { userId: ali.id, type: 'TASK_ASSIGNED', title: 'New Task Assigned', message: 'You have been assigned: SSL certificate renewal', link: '/tasks' },
      { userId: admin.id, type: 'SIM_EXPIRY', title: 'SIM Expiry Alert', message: 'SIM 0321-9876543 expires in 15 days', link: '/sims' },
      { userId: teamLead.id, type: 'PROJECT_UPDATE', title: 'Project Update', message: 'Mobile App v2.0 is now in Testing phase', link: '/projects' },
    ]
  });
  console.log(`✅ Notifications: 4 created`);

  // ── Audit Logs ────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { companyId: company.id, userId: superAdmin.id, action: 'LOGIN', module: 'AUTH', details: 'Super Admin logged in', ipAddress: '127.0.0.1' },
      { companyId: company.id, userId: admin.id, action: 'CREATE', module: 'EMPLOYEE', details: 'Created employee: Sara Khan' },
      { companyId: company.id, userId: admin.id, action: 'ASSIGN', module: 'ASSET', details: 'Assigned Dell Latitude to Sara Khan' },
      { companyId: company.id, userId: teamLead.id, action: 'CREATE', module: 'PROJECT', details: 'Created project: OpsFlow ERP Development' },
      { companyId: company.id, userId: admin.id, action: 'CREATE', module: 'CREDENTIAL', details: 'Added credential: Google Workspace Admin' },
      { companyId: company.id, userId: superAdmin.id, action: 'CREDENTIAL_VIEW', module: 'CREDENTIAL', details: 'Viewed password for: Google Workspace Admin', ipAddress: '127.0.0.1' },
    ]
  });
  console.log(`✅ Audit Logs: 6 created`);

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ OpsFlow ERP v2 seeded successfully!\n`);
  console.log(`📋 LOGIN CREDENTIALS:`);
  console.log(`   Super Admin : superadmin@opsflow.com / Admin@2024`);
  console.log(`   Admin       : admin@opsflow.com / Admin@2024`);
  console.log(`   Team Lead   : teamlead@opsflow.com / Employee@2024`);
  console.log(`   Employee    : sara@opsflow.com / Employee@2024`);
  console.log(`${'═'.repeat(50)}\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
