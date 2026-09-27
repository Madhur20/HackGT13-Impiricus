// Shared demo datastore for cross-device consult delivery. The publishable key is
// public by design; the table holds synthetic records only (see org/DECISIONS.md).
const defaultSupabaseUrl = "https://fxfmvinhzlaiwqrxvipu.supabase.co";
const defaultSupabaseAnonKey = "sb_publishable_sQHrOp6eAP1u6jzRnByk6Q_muq6L1lW";

export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL ?? defaultSupabaseUrl;
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? defaultSupabaseAnonKey;
export const sharedSyncEnabled = Boolean(supabaseUrl && supabaseAnonKey);
