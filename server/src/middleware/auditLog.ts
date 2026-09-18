import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { prisma } from '../lib/prisma';

interface AuditOptions {
  action: string;
  resourceType: string;
  getResourceId?: (req: Request) => string | undefined;
}

export const auditLog = (options: AuditOptions) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    // Run after the route handler succeeds — but we only log attempts here
    // Full audit is done in controllers for more context
    try {
      if (req.admin) {
        const ip =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
          req.socket.remoteAddress ||
          'unknown';

        const metadata = {
          method: req.method,
          path: req.path,
          body: req.method !== 'GET' ? sanitizeBody(req.body) : undefined,
        };

        await prisma.auditLog.create({
          data: {
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: options.action,
            resourceType: options.resourceType,
            resourceId: options.getResourceId?.(req),
            ipAddress: ip,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: JSON.parse(JSON.stringify(metadata)) as any,
          },
        });
      }
    } catch {
      // Audit log failure should not break the request
      console.error('[Audit] Failed to write audit log');
    }
    next();
  };
};

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...body };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'key', 'adCode'];
  sensitiveKeys.forEach((k) => {
    if (k in sanitized) sanitized[k] = '[REDACTED]';
  });
  return sanitized;
}

