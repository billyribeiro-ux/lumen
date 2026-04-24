// Better Auth catch-all handler. Matches every request under /api/auth/*
// and delegates to Better Auth's request handler.

import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handler: RequestHandler = ({ request }) => auth.handler(request);

export const GET = handler;
export const POST = handler;
