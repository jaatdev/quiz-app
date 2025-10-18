import { fetchAuditLogs } from '../audit.controller';
import { describe, it, expect } from 'vitest';

// simple mock prisma client
const makeMockPrisma = (items: any[]) => {
  return {
    auditLog: {
      findMany: async ({ where, orderBy, skip, take }: any) => {
        // ignore where/order for simplicity, return slice
        return items.slice(skip, skip + take).map((it, i) => ({ ...it }));
      },
      count: async ({ where }: any) => {
        return items.length;
      },
    },
  };
};

describe('fetchAuditLogs', () => {
  it('returns paginated results', async () => {
    const items = Array.from({ length: 45 }).map((_, i) => ({ id: `a${i}`, event: 'TEST', actorEmail: `u${i}@example.com`, createdAt: new Date().toISOString() }));
    const prisma = makeMockPrisma(items);

    const res1 = await fetchAuditLogs(prisma, { page: 1, pageSize: 20 });
    expect(res1.items).toHaveLength(20);
    expect(res1.total).toBe(45);
    expect(res1.page).toBe(1);
    expect(res1.totalPages).toBe(Math.ceil(45 / 20));

    const res3 = await fetchAuditLogs(prisma, { page: 3, pageSize: 20 });
    expect(res3.items).toHaveLength(5);
    expect(res3.page).toBe(3);
  });

  it('applies search by actorEmail or event', async () => {
    const items = [
      { id: '1', event: 'QUIZ_LANG_PRUNE', actorEmail: 'admin@example.com', createdAt: new Date().toISOString() },
      { id: '2', event: 'OTHER', actorEmail: 'someone@example.com', createdAt: new Date().toISOString() },
    ];
    const prisma = {
      auditLog: {
        findMany: async ({ where, skip, take }: any) => {
          // very small emulation of where.OR contains
          if (where && where.OR) {
            const q = where.OR;
            if (q.some((clause: any) => clause.actorEmail?.contains?.includes('admin') || clause.event?.contains?.includes('QUIZ')) ) {
              return [items[0]];
            }
          }
          return items;
        },
        count: async ({ where }: any) => {
          if (where && where.OR) return 1;
          return items.length;
        }
      }
    } as any;

    const res = await fetchAuditLogs(prisma, { page: 1, pageSize: 20, search: 'admin' });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].actorEmail).toContain('admin');
  });
});
