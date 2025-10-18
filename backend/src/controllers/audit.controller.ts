import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listAuditLogs(req: Request, res: Response) {
  try {
    const rawPage = parseInt(String(req.query.page ?? '1'), 10);
    const rawPageSize = parseInt(String(req.query.pageSize ?? '20'), 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const MAX_PAGE_SIZE = 100;
    const pageSize = Number.isFinite(rawPageSize) && rawPageSize > 0 ? Math.min(rawPageSize, MAX_PAGE_SIZE) : 20;
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { actorEmail: { contains: search, mode: 'insensitive' } },
        { event: { contains: search, mode: 'insensitive' } },
      ];
    }

    const result = await fetchAuditLogs(prisma, { page, pageSize, search });
    res.json(result);
  } catch (error) {
    console.error('Failed to list audit logs:', error);
    res.status(500).json({ error: 'Failed to list audit logs' });
  }
}

export type FetchAuditLogsOptions = { page?: number; pageSize?: number; search?: string };

export async function fetchAuditLogs(prismaClient: any, opts: FetchAuditLogsOptions = {}) {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const pageSize = opts.pageSize && opts.pageSize > 0 ? Math.min(opts.pageSize, 100) : 20;
  const search = typeof opts.search === 'string' ? opts.search.trim() : '';
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (search) {
    where.OR = [
      { actorEmail: { contains: search, mode: 'insensitive' } },
      { event: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prismaClient.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
    prismaClient.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { items, total, page, pageSize, totalPages };
}
