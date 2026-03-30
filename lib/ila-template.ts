export const SCHEDULE_A: Record<string, { fee: number; description: string }> = {
  'Community Tier': {
    fee: 1500,
    description:
      'Up to 3 facilitators, unlimited cohorts within license year',
  },
  'Standard Organization': {
    fee: 2500,
    description:
      'Up to 8 facilitators, unlimited cohorts within license year',
  },
  'Multi-site': {
    fee: 4000,
    description:
      'Unlimited facilitators, unlimited sites, unlimited cohorts within license year',
  },
};

export const BOOKS_OPTIONS = [
  'Book 1 — In The Quiet',
  'Book 2 — Through The Weight',
  'Book 3 — Toward the Light',
  'Book 4 — With the Memory',
];

export interface ILAData {
  org_name: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  org_address: string;
  org_state: string;
  license_tier: string;
  license_fee: number;
  license_start_date: string; // YYYY-MM-DD
  license_renewal_date: string; // YYYY-MM-DD
  books_licensed: string[];
  execution_date: string; // YYYY-MM-DD
  org_signature?: string;
  org_date?: string;
  wayne_signature?: string;
  wayne_date?: string;
  agreement_token: string;
  renewalNote?: string;
}
