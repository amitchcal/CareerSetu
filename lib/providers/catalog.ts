export interface CatalogQuery {
  keyword?: string;
  category?: string;
  market_code: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_minor: number;
  currency: string;
  image_url?: string;
}

export interface CatalogProvider {
  search(query: CatalogQuery): Promise<CatalogItem[]>;
}

// Placeholder — swap in a real catalog API behind this interface
class NullCatalogProvider implements CatalogProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async search(_q: CatalogQuery): Promise<CatalogItem[]> {
    return [];
  }
}

export function getCatalogProvider(): CatalogProvider {
  return new NullCatalogProvider();
}
