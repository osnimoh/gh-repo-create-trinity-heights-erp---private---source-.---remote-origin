import { z } from "zod";

// Validate environment at the boundary. Fail fast and loud rather than letting
// an undefined key reach Supabase and silently break auth.

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

function readPublicEnv() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!parsed.success) {
    const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    // NEXT_PUBLIC_* are inlined at BUILD time — they must be set in the build
    // environment (e.g. Vercel → Settings → Environment Variables) or the build
    // fails here while collecting page data.
    throw new Error(
      `Missing or invalid public environment variable(s): ${keys}. ` +
        `Set NEXT_PUBLIC_SUPABASE_URL (a valid URL) and ` +
        `NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment / deployment settings.`,
    );
  }
  return parsed.data;
}

export const publicEnv = readPublicEnv();

// Server-only secrets. Reading this from client code is a bug — it is only
// imported by server modules. The service-role key bypasses RLS.
export function serverEnv() {
  const schema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  });
  const parsed = schema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (server-only). Set it in your " +
        "deployment settings — required for admin actions under /settings.",
    );
  }
  return parsed.data;
}
