// Supabase Client — School Transport Safety Console
// Uses the official @supabase/supabase-js SDK
// Credentials come from .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON);

// Singleton client — safe for both Client and Server Components
export const supabase = isSupabaseConfigured()
  ? createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

// ─────────────────────────────────────────────
// Generic helpers
// ─────────────────────────────────────────────

/** Fetch all rows from a table */
export async function fetchAll<T>(table: string): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select('*');
  if (error) { console.warn(`[Supabase] fetchAll(${table}):`, error.message); return []; }
  return (data ?? []) as T[];
}

/** Upsert a single record (insert or update by primary key) */
export async function upsertRecord<T extends object>(table: string, record: T): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from(table).upsert(record as any);
  if (error) { console.warn(`[Supabase] upsert(${table}):`, error.message); return false; }
  return true;
}

/** Delete a row by its primary key column */
export async function deleteRecord(table: string, idCol: string, idValue: string | number): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from(table).delete().eq(idCol, idValue);
  if (error) { console.warn(`[Supabase] delete(${table}):`, error.message); return false; }
  return true;
}

/** Insert a GPS telemetry log entry */
export async function logTelemetry(entry: {
  device_id: string;
  imei: string;
  bus_id: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ignition_on: boolean;
  battery_voltage?: number;
  satellites_connected?: number;
  raw_payload?: string;
}) {
  if (!supabase) return;
  const { error } = await supabase.from('gps_telemetry_logs').insert(entry);
  if (error) console.warn('[Supabase] logTelemetry:', error.message);
}
