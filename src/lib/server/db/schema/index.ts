// Lumen schema — barrel re-export.
//
// Drizzle's query builder reads the schema graph from what this file
// re-exports. Keep this list complete. Exports are alphabetized by
// module filename (not by domain) because Biome sorts them that way.
//
// Table count target: 31 across 8 domains (per LUMEN_VISION.md):
//   - Auth (4):         auth.ts        — users, sessions, accounts, verification
//   - Organizations (3): organizations.ts — organizations, memberships, invitations
//   - RBAC (3):         rbac.ts        — roles, permissions, role_permissions
//   - Content (6):      nodes.ts, links.ts, tags.ts
//                                      — nodes, node_content, node_versions,
//                                        links, tags, node_tags
//   - Satellites (5):   decisions.ts, snippets.ts, dailies.ts,
//                       publications.ts, inbox.ts
//   - AI (2):           ai.ts          — ai_conversations, ai_messages
//   - Billing (6):      billing.ts     — products, prices, subscriptions,
//                                        invoices, payment_methods, entitlements
//   - System (2):       audit.ts, webhooks.ts — audit_log, webhook_events

export * from './_columns';
export * from './ai';
export * from './audit';
export * from './auth';
export * from './billing';
export * from './dailies';
export * from './decisions';
export * from './inbox';
export * from './links';
export * from './nodes';
export * from './organizations';
export * from './publications';
export * from './rbac';
export * from './snippets';
export * from './tags';
export * from './webhooks';
