import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ConsultRequest } from "@relay/domain";
import { sharedSyncEnabled, supabaseAnonKey, supabaseUrl } from "./sync-config";

const table = "consult_requests";

type ConsultRow = { id: string; data: ConsultRequest; updated_at: string };

let client: SupabaseClient | null = null;

function getClient() {
  if (!sharedSyncEnabled) return null;
  client ??= createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  return client;
}

export async function fetchAllConsults(): Promise<ConsultRequest[] | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select("data");
  if (error) {
    console.warn("Consult sync fetch failed", error.message);
    return null;
  }
  return (data as Pick<ConsultRow, "data">[]).map((row) => row.data);
}

export async function upsertConsults(requests: ConsultRequest[]) {
  const supabase = getClient();
  if (!supabase || requests.length === 0) return;
  const rows: ConsultRow[] = requests.map((request) => ({ id: request.id, data: request, updated_at: request.updatedAt }));
  const { error } = await supabase.from(table).upsert(rows);
  if (error) console.warn("Consult sync write failed", error.message);
}

export function subscribeToConsults(onChange: (request: ConsultRequest) => void) {
  const supabase = getClient();
  if (!supabase) return () => undefined;
  const channel = supabase
    .channel("consult-requests")
    .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
      const row = payload.new as Partial<ConsultRow> | undefined;
      if (row?.data) onChange(row.data);
    })
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

// Newest update wins per request; list stays newest-created first.
export function mergeConsults(current: ConsultRequest[], incoming: ConsultRequest[]): ConsultRequest[] {
  const byId = new Map(current.map((request) => [request.id, request]));
  let changed = false;
  for (const request of incoming) {
    const existing = byId.get(request.id);
    if (!existing || request.updatedAt > existing.updatedAt) {
      byId.set(request.id, request);
      changed = true;
    }
  }
  if (!changed) return current;
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
