// ═══════════════════════════════════════════
// COMBINED ROUTES FILE
// Users, Employees, Assets, SIMs, Credentials,
// Projects, Tasks, Todos, Files, Notifications,
// Audit, Dashboard, Tickets
// ═══════════════════════════════════════════
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import prisma from '../shared/prisma/client';
import { AuthRequest } from '../shared/types';
import { authorize } from '../shared/middleware/auth.middleware';
import { getPagination, buildPaginatedResponse, encrypt, decrypt, success, buildSearchFilter } from '../shared/utils';
import { logAudit } from '../shared/middleware/error.middleware';

// ── Multer ────────────────────────────────
const makeStorage = (folder: string) => multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, `../../../uploads/${folder}`)),
  filename: (_, file, cb) => cb(null, `${uuid()}${path.extname(file.originalname)}`)
});
const upload = (folder: string) => multer({ storage: makeStorage(folder), limits: { fileSize: 50 * 1024 * 1024 } });

// ════════════════════════════════════════════
// USERS
// ════════════════════════════════════════════
export const usersRouter = Router();

usersRouter.get('/', authorize('user.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const search = req.query.search as string;
    const where: any = { companyId: req.user!.companyId, deletedAt: null };
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } }
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, include: { role: true, employee: { select: { designation: true, department: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(users.map(({ password, refreshToken, ...u }) => u), total, page, limit)));
  } catch (e) { res.status(500).json({ success: false, error: 'Server error' }); }
});

usersRouter.post('/', authorize('user.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, roleId } = req.body;
    const hashed = await bcrypt.hash(password || 'OpsFlow@2024', 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashed, name, roleId, companyId: req.user!.companyId },
      include: { role: true }
    });
    const { password: _, ...safe } = user;
    res.status(201).json(success(safe));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

usersRouter.put('/:id/role', authorize('user.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { roleId: req.body.roleId }, include: { role: true } });
    res.json(success(user));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

usersRouter.put('/:id/status', authorize('user.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(success(user));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// EMPLOYEES
// ════════════════════════════════════════════
export const employeesRouter = Router();
const empUpload = upload('employees');

employeesRouter.get('/', authorize('employee.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { search, status, department } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId, deletedAt: null };
    if (status) where.status = status;
    if (department) where.department = department;
    if (search) where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { designation: { contains: search, mode: 'insensitive' } },
      { user: { email: { contains: search, mode: 'insensitive' } } }
    ];
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, include: { user: { select: { id: true, email: true, status: true, lastLogin: true, role: { select: { name: true } } } }, assignedAssets: { select: { assetTag: true, category: true, status: true } }, assignedSims: { select: { simNumber: true, network: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.employee.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(employees, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

employeesRouter.get('/:id', authorize('employee.view'), async (req: AuthRequest, res: Response) => {
  try {
    const emp = await prisma.employee.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId }, include: { user: { select: { id: true, email: true, role: true, status: true, lastLogin: true, permissions: { include: { permission: true } } } }, assignedAssets: true, assignedSims: true, documents: true } });
    if (!emp) return res.status(404).json({ success: false, error: 'Employee not found' });
    res.json(success(emp));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

employeesRouter.post('/', authorize('employee.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, roleId, ...empData } = req.body;
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: email.toLowerCase(), password: await bcrypt.hash(password || 'OpsFlow@2024', 12), name: empData.fullName, roleId, companyId: req.user!.companyId } });
      const emp = await tx.employee.create({ data: { ...empData, userId: user.id, companyId: req.user!.companyId }, include: { user: { select: { id: true, email: true, role: true } } } });
      return emp;
    });
    await logAudit({ userId: req.user!.id, companyId: req.user!.companyId, action: 'CREATE', module: 'EMPLOYEE', entityId: result.id, details: `Created employee: ${result.fullName}` });
    res.status(201).json(success(result));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

employeesRouter.put('/:id', authorize('employee.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const emp = await prisma.employee.update({ where: { id: req.params.id }, data: req.body, include: { user: { select: { id: true, email: true, role: true } } } });
    res.json(success(emp));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

employeesRouter.delete('/:id', authorize('employee.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.employee.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json(success(null, 'Employee deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

employeesRouter.post('/:id/documents', authorize('employee.edit'), empUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const doc = await prisma.employeeDocument.create({ data: { employeeId: req.params.id, name: req.body.name || req.file.originalname, type: req.body.docType || req.file.mimetype, url: `/uploads/employees/${req.file.filename}`, size: req.file.size } });
    res.status(201).json(success(doc));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// ASSETS
// ════════════════════════════════════════════
export const assetsRouter = Router();

assetsRouter.get('/', authorize('asset.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { search, category, status } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId, deletedAt: null };
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.OR = [{ assetTag: { contains: search, mode: 'insensitive' } }, { brand: { contains: search, mode: 'insensitive' } }, { model: { contains: search, mode: 'insensitive' } }, { serialNumber: { contains: search, mode: 'insensitive' } }];
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({ where, include: { employee: { select: { fullName: true } }, history: { take: 3, orderBy: { createdAt: 'desc' } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.asset.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(assets, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

assetsRouter.get('/:id', authorize('asset.view'), async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId }, include: { employee: true, history: { orderBy: { createdAt: 'desc' } }, sim: true } });
    if (!asset) return res.status(404).json({ success: false, error: 'Asset not found' });
    res.json(success(asset));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

assetsRouter.post('/', authorize('asset.create'), async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.create({ data: { ...req.body, companyId: req.user!.companyId } });
    await logAudit({ userId: req.user!.id, companyId: req.user!.companyId, action: 'CREATE', module: 'ASSET', entityId: asset.id, details: `Created asset: ${asset.assetTag}` });
    res.status(201).json(success(asset));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

assetsRouter.put('/:id', authorize('asset.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.update({ where: { id: req.params.id }, data: req.body });
    res.json(success(asset));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

assetsRouter.post('/:id/assign', authorize('asset.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId } = req.body;
    const asset = await prisma.$transaction(async tx => {
      await tx.assetHistory.create({ data: { assetId: req.params.id, action: 'ASSIGNED', employeeId, performedBy: req.user!.id } });
      return tx.asset.update({ where: { id: req.params.id }, data: { employeeId, status: 'ASSIGNED' } });
    });
    await logAudit({ userId: req.user!.id, companyId: req.user!.companyId, action: 'ASSIGN', module: 'ASSET', entityId: asset.id, details: `Asset assigned` });
    res.json(success(asset));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

assetsRouter.delete('/:id', authorize('asset.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.asset.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json(success(null, 'Asset deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// SIMs
// ════════════════════════════════════════════
export const simsRouter = Router();

simsRouter.get('/', authorize('sim.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, network } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId };
    if (status) where.status = status;
    if (network) where.network = network;
    if (search) where.OR = [{ simNumber: { contains: search, mode: 'insensitive' } }, { packageName: { contains: search, mode: 'insensitive' } }];
    const sims = await prisma.sim.findMany({ where, include: { employee: { select: { fullName: true } }, asset: { select: { assetTag: true, brand: true, model: true } }, cameras: true }, orderBy: { createdAt: 'desc' } });
    res.json(success(sims));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

simsRouter.post('/', authorize('sim.create'), async (req: AuthRequest, res: Response) => {
  try {
    const sim = await prisma.sim.create({ data: { ...req.body, companyId: req.user!.companyId } });
    res.status(201).json(success(sim));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

simsRouter.put('/:id', authorize('sim.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const sim = await prisma.sim.update({ where: { id: req.params.id }, data: req.body });
    res.json(success(sim));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

simsRouter.delete('/:id', authorize('sim.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.sim.delete({ where: { id: req.params.id } });
    res.json(success(null, 'SIM deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// Cameras under SIMs
simsRouter.get('/cameras', authorize('sim.view'), async (req: AuthRequest, res: Response) => {
  try {
    const cameras = await prisma.camera.findMany({ include: { sim: true }, orderBy: { createdAt: 'desc' } });
    res.json(success(cameras));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

simsRouter.post('/cameras', authorize('sim.create'), async (req: AuthRequest, res: Response) => {
  try {
    const cam = await prisma.camera.create({ data: req.body });
    res.status(201).json(success(cam));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

// ════════════════════════════════════════════
// CREDENTIALS
// ════════════════════════════════════════════
export const credentialsRouter = Router();

credentialsRouter.get('/', authorize('credential.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { search, category } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId, isActive: true };
    if (category) where.category = category;
    if (search) where.OR = [{ platform: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }];
    const creds = await prisma.credential.findMany({ where, select: { id: true, platform: true, category: true, username: true, email: true, recoveryEmail: true, notes: true, tags: true, employeeId: true, isActive: true, lastAccessed: true, createdAt: true }, orderBy: { platform: 'asc' } });
    res.json(success(creds));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

credentialsRouter.post('/', authorize('credential.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const cred = await prisma.credential.create({ data: { ...rest, passwordEnc: encrypt(password), companyId: req.user!.companyId } });
    res.status(201).json(success({ ...cred, passwordEnc: undefined }));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

credentialsRouter.get('/:id/reveal', authorize('credential.view'), async (req: AuthRequest, res: Response) => {
  try {
    const cred = await prisma.credential.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId } });
    if (!cred) return res.status(404).json({ success: false, error: 'Not found' });
    await prisma.credentialAccessLog.create({ data: { credentialId: cred.id, userId: req.user!.id, reason: req.body.reason, ipAddress: req.ip } });
    await prisma.credential.update({ where: { id: cred.id }, data: { lastAccessed: new Date() } });
    await logAudit({ userId: req.user!.id, companyId: req.user!.companyId, action: 'CREDENTIAL_VIEW', module: 'CREDENTIAL', entityId: cred.id, details: `Viewed password for: ${cred.platform}` });
    res.json(success({ password: decrypt(cred.passwordEnc) }));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

credentialsRouter.put('/:id', authorize('credential.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { password, ...rest } = req.body;
    const data: any = { ...rest };
    if (password) data.passwordEnc = encrypt(password);
    const cred = await prisma.credential.update({ where: { id: req.params.id }, data });
    res.json(success({ ...cred, passwordEnc: undefined }));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// PROJECTS
// ════════════════════════════════════════════
export const projectsRouter = Router();

projectsRouter.get('/', authorize('project.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { search, status, priority } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId, deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    const [projects, total] = await Promise.all([
      prisma.project.findMany({ where, include: { members: { include: { user: { select: { id: true, name: true, avatar: true } } } }, tasks: { select: { id: true, status: true } }, milestones: { select: { id: true, completed: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.project.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(projects, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

projectsRouter.get('/:id', authorize('project.view'), async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.findFirst({ where: { id: req.params.id, companyId: req.user!.companyId, deletedAt: null }, include: { members: { include: { user: { select: { id: true, name: true, avatar: true, email: true } } } }, tasks: { include: { assignee: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' } }, milestones: { orderBy: { order: 'asc' } }, discussions: { include: { user: { select: { id: true, name: true, avatar: true } }, replies: { include: { user: { select: { id: true, name: true, avatar: true } } } } }, orderBy: { createdAt: 'desc' } } } });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json(success(project));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

projectsRouter.post('/', authorize('project.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { members, ...data } = req.body;
    const project = await prisma.project.create({
      data: { ...data, companyId: req.user!.companyId, members: members ? { create: members.map((m: any) => ({ userId: m.userId || m, role: m.role || 'member' })) } : undefined },
      include: { members: { include: { user: { select: { name: true } } } } }
    });
    await logAudit({ userId: req.user!.id, companyId: req.user!.companyId, action: 'CREATE', module: 'PROJECT', entityId: project.id, details: `Created: ${project.name}` });
    res.status(201).json(success(project));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

projectsRouter.put('/:id', authorize('project.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const project = await prisma.project.update({ where: { id: req.params.id }, data: req.body });
    res.json(success(project));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

projectsRouter.delete('/:id', authorize('project.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.project.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json(success(null, 'Project deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

projectsRouter.post('/:id/discussions', authorize('project.view'), async (req: AuthRequest, res: Response) => {
  try {
    const disc = await prisma.discussion.create({ data: { projectId: req.params.id, userId: req.user!.id, content: req.body.content, mentions: req.body.mentions || [] }, include: { user: { select: { id: true, name: true, avatar: true } } } });
    res.status(201).json(success(disc));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

projectsRouter.post('/:id/milestones', authorize('project.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const ms = await prisma.milestone.create({ data: { ...req.body, projectId: req.params.id } });
    res.status(201).json(success(ms));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// TASKS
// ════════════════════════════════════════════
export const tasksRouter = Router();

tasksRouter.get('/', authorize('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { search, status, priority, projectId, assigneeId } = req.query as Record<string, string>;
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, include: { assignee: { select: { id: true, name: true, avatar: true } }, creator: { select: { id: true, name: true } }, project: { select: { id: true, name: true } }, comments: { select: { id: true } }, attachments: true }, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' } }),
      prisma.task.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(tasks, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

tasksRouter.get('/kanban', authorize('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { projectId } = req.query as Record<string, string>;
    const where: any = { deletedAt: null };
    if (projectId) where.projectId = projectId;
    const tasks = await prisma.task.findMany({ where, include: { assignee: { select: { id: true, name: true, avatar: true } }, project: { select: { id: true, name: true } }, comments: { select: { id: true } }, attachments: { select: { id: true } } }, orderBy: { order: 'asc' } });
    const kanban = { PENDING: tasks.filter(t => t.status === 'PENDING'), IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'), REVIEW: tasks.filter(t => t.status === 'REVIEW'), COMPLETED: tasks.filter(t => t.status === 'COMPLETED'), HOLD: tasks.filter(t => t.status === 'HOLD') };
    res.json(success(kanban));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

tasksRouter.post('/', authorize('task.create'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.task.create({ data: { ...req.body, creatorId: req.user!.id }, include: { assignee: { select: { id: true, name: true } }, project: { select: { name: true } } } });
    if (task.assigneeId && task.assigneeId !== req.user!.id) {
      await prisma.notification.create({ data: { userId: task.assigneeId, type: 'TASK_ASSIGNED', title: 'New Task', message: `You have been assigned: ${task.title}`, link: `/tasks/${task.id}` } });
    }
    await logAudit({ userId: req.user!.id, action: 'CREATE', module: 'TASK', entityId: task.id, details: `Created task: ${task.title}` });
    res.status(201).json(success(task));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

tasksRouter.put('/:id', authorize('task.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: req.body, include: { assignee: { select: { name: true } } } });
    res.json(success(task));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

tasksRouter.patch('/:id/status', authorize('task.edit'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status: req.body.status } });
    res.json(success(task));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

tasksRouter.post('/:id/comments', authorize('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.taskComment.create({ data: { taskId: req.params.id, userId: req.user!.id, content: req.body.content }, include: { user: { select: { id: true, name: true, avatar: true } } } });
    res.status(201).json(success(comment));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

tasksRouter.delete('/:id', authorize('task.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.task.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    res.json(success(null, 'Task deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// TODOS
// ════════════════════════════════════════════
export const todosRouter = Router();

todosRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, type, date } = req.query as Record<string, string>;
    const where: any = { userId: req.user!.id, companyId: req.user!.companyId, isArchived: false, parentId: null };
    if (status) where.status = status;
    if (type) where.type = type;
    const todos = await prisma.todo.findMany({ where, orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }] });
    res.json(success(todos));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

todosRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const todo = await prisma.todo.create({ data: { ...req.body, userId: req.user!.id, companyId: req.user!.companyId } });
    res.status(201).json(success(todo));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

todosRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const todo = await prisma.todo.update({ where: { id: req.params.id }, data: req.body });
    res.json(success(todo));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

todosRouter.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const todo = await prisma.todo.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    res.json(success(todo));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

todosRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.todo.delete({ where: { id: req.params.id } });
    res.json(success(null, 'Todo deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// FILES
// ════════════════════════════════════════════
export const filesRouter = Router();
const fileUpload = upload('files');

filesRouter.get('/', authorize('file.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { folder, search } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId };
    if (folder) where.folder = folder;
    if (search) where.name = { contains: search, mode: 'insensitive' };
    const files = await prisma.file.findMany({ where, include: { uploader: { select: { name: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(success(files));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

filesRouter.post('/upload', authorize('file.upload'), fileUpload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file' });
    const file = await prisma.file.create({ data: { companyId: req.user!.companyId, name: req.body.name || req.file.originalname, originalName: req.file.originalname, type: req.file.mimetype, size: req.file.size, url: `/uploads/files/${req.file.filename}`, folder: req.body.folder || 'General', uploadedBy: req.user!.id } });
    await logAudit({ userId: req.user!.id, action: 'UPLOAD', module: 'FILE', entityId: file.id, details: `Uploaded: ${file.name}` });
    res.status(201).json(success(file));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

filesRouter.delete('/:id', authorize('file.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.file.delete({ where: { id: req.params.id } });
    res.json(success(null, 'File deleted'));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════
export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 30 });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json(success({ notifications, unreadCount }));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

notificationsRouter.put('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json(success(null));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

notificationsRouter.put('/read-all', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
    res.json(success(null));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// AUDIT
// ════════════════════════════════════════════
export const auditRouter = Router();

auditRouter.get('/', authorize('audit.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { module, action, userId } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId };
    if (module) where.module = module;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, include: { user: { select: { name: true, avatar: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(logs, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════
export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const cid = req.user!.companyId;
    const [employees, activeProjects, pendingTasks, completedTasks, assignedAssets, availableAssets, openTickets, criticalTasks, upcomingDeadlines, recentActivity, todayTodos, simsExpiringSoon] = await Promise.all([
      prisma.employee.count({ where: { companyId: cid, status: 'ACTIVE', deletedAt: null } }),
      prisma.project.count({ where: { companyId: cid, status: 'IN_PROGRESS', deletedAt: null } }),
      prisma.task.count({ where: { status: 'PENDING', deletedAt: null } }),
      prisma.task.count({ where: { status: 'COMPLETED', deletedAt: null } }),
      prisma.asset.count({ where: { companyId: cid, status: 'ASSIGNED', deletedAt: null } }),
      prisma.asset.count({ where: { companyId: cid, status: 'AVAILABLE', deletedAt: null } }),
      prisma.ticket.count({ where: { companyId: cid, status: 'OPEN' } }),
      prisma.task.count({ where: { priority: 'CRITICAL', status: { not: 'COMPLETED' }, deletedAt: null } }),
      prisma.task.findMany({ where: { deadline: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) }, status: { not: 'COMPLETED' }, deletedAt: null }, include: { assignee: { select: { name: true } }, project: { select: { name: true } } }, orderBy: { deadline: 'asc' }, take: 5 }),
      prisma.auditLog.findMany({ where: { companyId: cid }, include: { user: { select: { name: true, avatar: true } } }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.todo.count({ where: { companyId: cid, status: 'PENDING', dueDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) } } }),
      prisma.sim.count({ where: { companyId: cid, expiryDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) } } })
    ]);
    res.json(success({ employees, activeProjects, pendingTasks, completedTasks, assignedAssets, availableAssets, openTickets, criticalTasks, upcomingDeadlines, recentActivity, todayTodos, simsExpiringSoon }));
  } catch (e) { console.error(e); res.status(500).json({ success: false, error: 'Server error' }); }
});

dashboardRouter.get('/charts', async (req: AuthRequest, res: Response) => {
  try {
    const cid = req.user!.companyId;
    const [tasksByStatus, projectsByStatus, assetsByCategory, tasksByPriority] = await Promise.all([
      prisma.task.groupBy({ by: ['status'], where: { deletedAt: null }, _count: { id: true } }),
      prisma.project.groupBy({ by: ['status'], where: { companyId: cid, deletedAt: null }, _count: { id: true } }),
      prisma.asset.groupBy({ by: ['category'], where: { companyId: cid, deletedAt: null }, _count: { id: true } }),
      prisma.task.groupBy({ by: ['priority'], where: { deletedAt: null, status: { not: 'COMPLETED' } }, _count: { id: true } })
    ]);
    res.json(success({ tasksByStatus, projectsByStatus, assetsByCategory, tasksByPriority }));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

// ════════════════════════════════════════════
// TICKETS
// ════════════════════════════════════════════
export const ticketsRouter = Router();

ticketsRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit } = getPagination(req.query.page as string, req.query.limit as string);
    const { status, category, priority } = req.query as Record<string, string>;
    const where: any = { companyId: req.user!.companyId };
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({ where, include: { creator: { select: { name: true } }, assignee: { select: { name: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.ticket.count({ where })
    ]);
    res.json(success(buildPaginatedResponse(tickets, total, page, limit)));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

ticketsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.create({ data: { ...req.body, creatorId: req.user!.id, companyId: req.user!.companyId } });
    res.status(201).json(success(ticket));
  } catch (e: any) { res.status(500).json({ success: false, error: e.message }); }
});

ticketsRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const ticket = await prisma.ticket.update({ where: { id: req.params.id }, data: req.body });
    res.json(success(ticket));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});

ticketsRouter.post('/:id/comments', async (req: AuthRequest, res: Response) => {
  try {
    const comment = await prisma.ticketComment.create({ data: { ticketId: req.params.id, userId: req.user!.id, content: req.body.content }, include: { user: { select: { name: true, avatar: true } } } });
    res.status(201).json(success(comment));
  } catch { res.status(500).json({ success: false, error: 'Server error' }); }
});
