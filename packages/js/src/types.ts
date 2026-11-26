export interface Source {
  authors?: string;
  year?: number;
  journal?: string;
  doi?: string;
  [k: string]: unknown;
}
export interface Entry {
  id: string;
  name: string;
  category: string;
  equation: string;
  inputs: string[];
  source: Source;
  canonical_page?: string;
  coefficients?: unknown;
  [k: string]: unknown;
}
export interface Registry {
  registry_version: string;
  last_updated: string;
  license: string;
  attribution_notice: string;
  canonical_page: string;
  formula_count: number;
  formulas: Entry[];
  [k: string]: unknown;
}
