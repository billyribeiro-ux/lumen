// Better Auth catch-all handler. Matches every request under /api/auth/*
// and delegates to Better Auth's request handler.

import { getAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handler: RequestHandler = ({ request }) => getAuth().handler(request);

export const GET = handler;
export const POST = handler;
