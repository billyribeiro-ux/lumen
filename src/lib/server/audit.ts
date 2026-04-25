// Audit log helper — every mutating action funnels through here so the
// `audit_log` table is the canonical record of who did what to which
// resource. Append-only; no updates after insert.
//
// Call from inside form actions and remote functions:
//
//   await audit(event, {
//     action: 'node.update',
//     resource: `node:${id}`,
//     organizationId,
//     before, after,
//   });

import type { RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import { auditLog } from './db/schema/audit';

export interface AuditInput {
  action: string;
  resource: string;
  organizationId?: string | null;
  before?: unknown;
  after?: unknown;
}

export async function audit(event: RequestEvent, input: AuditInput): Promise<void> {
  await db
    .insert(auditLog)
    .values({
      organizationId: input.organizationId ?? null,
      actorId: event.locals.user?.id ?? null,
      action: input.action,
      resource: input.resource,
      requestId: event.request.headers.get('x-request-id'),
      ipAddress: event.getClientAddress(),
      userAgent: event.request.headers.get('user-agent'),
      beforeState: input.before === undefined ? null : (input.before as never),
      afterState: input.after === undefined ? null : (input.after as never),
    })
    .catch((err) => {
      // Never fail the user-facing action because audit logging failed.
      // Surface to stderr so Sentry (Phase 14) picks it up.
      console.error('[audit] insert failed', err);
    });
}
