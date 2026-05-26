import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth/server";

const handlers = auth ? toNextJsHandler(auth) : null;
const notFound = async () => new Response(null, { status: 404 });

export const GET = handlers?.GET ?? notFound;
export const POST = handlers?.POST ?? notFound;
