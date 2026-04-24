// AI co-pilot schema — Claude-powered chat grounded in the user's graph.
//
// Tables defined now even though the feature ships in Phase 16 so RBAC
// and entitlements (Phase 4 / 13) can reference them. Per the
// VISION reconciliation in ARCHITECTURE.md §4.9.

import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { idColumn, timestamps } from './_columns';
import { users } from './auth';
import { organizations } from './organizations';

export const aiMessageRoleEnum = pgEnum('ai_message_role', ['user', 'assistant', 'tool', 'system']);
export type AiMessageRole = (typeof aiMessageRoleEnum.enumValues)[number];

export const aiConversations = pgTable(
  'ai_conversations',
  {
    id: idColumn(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // Anthropic model id used for this conversation, e.g. 'claude-opus-4-7'.
    model: text('model').notNull(),
    // Tier-derived per-conversation tally so quota enforcement can be cheap.
    tokenInputCount: integer('token_input_count').notNull().default(0),
    tokenOutputCount: integer('token_output_count').notNull().default(0),
    // Last user activity, used for sidebar ordering.
    lastMessageAt: timestamp('last_message_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .defaultNow(),
    ...timestamps(),
  },
  (table) => [
    index('ai_conversations_user_idx').on(table.userId),
    index('ai_conversations_org_idx').on(table.organizationId),
    index('ai_conversations_last_message_idx').on(table.lastMessageAt),
  ],
);

export const aiMessages = pgTable(
  'ai_messages',
  {
    id: idColumn(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => aiConversations.id, { onDelete: 'cascade' }),
    role: aiMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    // Array of node ids retrieved as RAG context for assistant turns.
    grounding: jsonb('grounding').notNull().default(sql`'[]'::jsonb`),
    // Per-message token counts mirrored from the Anthropic response.
    tokenCount: integer('token_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('ai_messages_conversation_created_idx').on(table.conversationId, table.createdAt),
  ],
);
