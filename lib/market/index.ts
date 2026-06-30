import { createSupabaseServerClient } from '@/lib/supabase-server';

export interface MarketProfile {
  market_code: string;
  config: {
    display_name: string;
    locale: string;
    currency: { code: string; symbol: string; format: string };
    units: 'metric' | 'imperial';
    area_basis: string;
    tax: { name: string; default_rate: number; applies_to: string };
    rate_library_ref: string;
    standards: Record<string, string | null>;
    cultural_rules: Array<{
      id: string;
      label: string;
      default_on: boolean;
      constraints: string[];
    }>;
    construction_modes: string[];
    brand_tiers: Record<string, string[]>;
  };
  version: number;
  active: boolean;
}

export interface RateLibraryItem {
  id: string;
  market_code: string;
  item_code: string;
  item_label: string;
  category: string;
  unit: string;
  rate_minor: number;
  tier: 'economy' | 'premium' | 'luxury';
  region: string;
  notes: string | null;
}

export async function getMarketProfile(marketCode: string): Promise<MarketProfile> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('market_profiles')
    .select('*')
    .eq('market_code', marketCode)
    .eq('active', true)
    .single();

  if (error || !data) throw new Error(`Market profile not found: ${marketCode}`);
  return data as MarketProfile;
}

export async function getRates(
  marketCode: string,
  filters?: { tier?: 'economy' | 'premium' | 'luxury'; region?: string }
): Promise<RateLibraryItem[]> {
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from('rate_libraries')
    .select('*')
    .eq('market_code', marketCode);

  if (filters?.tier) query = query.eq('tier', filters.tier);
  if (filters?.region) query = query.eq('region', filters.region);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch rates: ${error.message}`);
  return (data ?? []) as RateLibraryItem[];
}
