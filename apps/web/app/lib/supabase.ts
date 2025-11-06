import { createClient, type Provider, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseConfigErrorCode =
  | "supabase_url_missing"
  | "supabase_anon_key_missing"
  | "supabase_service_role_key_missing";

export class SupabaseConfigError extends Error {
  readonly code: SupabaseConfigErrorCode;
  readonly missingVariables: string[];

  constructor(code: SupabaseConfigErrorCode, missingVariables: string[]) {
    super(code);
    this.name = "SupabaseConfigError";
    this.code = code;
    this.missingVariables = missingVariables;
  }
}

let serverClient: SupabaseClient | null = null;
let serverClientUrl: string | null = null;
let serverClientKey: string | null = null;

let serviceRoleClient: SupabaseClient | null = null;
let serviceRoleClientUrl: string | null = null;
let serviceRoleKey: string | null = null;

function ensureSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  if (!url) {
    throw new SupabaseConfigError("supabase_url_missing", ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]);
  }
  return url;
}

function ensureAnonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!key) {
    throw new SupabaseConfigError("supabase_anon_key_missing", [
      "SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  }
  return key;
}

function ensureServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY ?? "";
  if (!key) {
    throw new SupabaseConfigError("supabase_service_role_key_missing", [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_KEY",
    ]);
  }
  return key;
}

function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getSupabaseServerClient(): SupabaseClient {
  const url = ensureSupabaseUrl();
  const key = ensureAnonKey();

  if (!serverClient || serverClientUrl !== url || serverClientKey !== key) {
    serverClient = createSupabaseClient(url, key);
    serverClientUrl = url;
    serverClientKey = key;
  }

  return serverClient;
}

export function getSupabaseServiceRoleClient(): SupabaseClient {
  const url = ensureSupabaseUrl();
  const key = ensureServiceRoleKey();

  if (!serviceRoleClient || serviceRoleClientUrl !== url || serviceRoleKey !== key) {
    serviceRoleClient = createSupabaseClient(url, key);
    serviceRoleClientUrl = url;
    serviceRoleKey = key;
  }

  return serviceRoleClient;
}

export type SupabaseAuthProvider = Provider;
