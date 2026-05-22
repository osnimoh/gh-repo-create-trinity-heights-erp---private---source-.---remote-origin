import { z } from "zod";

// Validate environment at the boundary. Fail fast and loud rather than letting
// an undefined key reach Supabase and silently break auth.

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

// Server-only secrets. Reading this from client code is a bug — it is only
// imported by server modules. The service-role key bypasses RLS.
export function serverEnv() {
  const schema = z.object({
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  });
  return schema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
