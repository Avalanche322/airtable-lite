export interface Item {
  id?: number;
  // flattened data fields from server.data
  title: string;
  status: string;
  score: number;
  category: string;
  created_by: string;
  assignee: string;
  priority: string;
  tags: string[];
  comments: string;
  approved: boolean;
  type: string;
  owner: string;
  size: number;
  color: string;
  source: string;
  rating: number;
  location: string;
  notes: string;
  active: boolean;
  created_at: string;
  version: number;
  updated_at: string;
  // local only fields for conflict resolution and pending state
  __conflict?: boolean;
  __pending?: { baseVersion: number; patch: Partial<Item> };
  __serverData?: Record<string, any>;
}

export interface ItemsPage {
  items: Item[];
  nextCursor: number | null;
  total: number;
}

export interface ItemsResponse {
  rows: {
	 id: number;
	 data: Item;
	 created_at: string;
	 updated_at: string;
	 version: number;
  }[];
  nextCursor: number | null;
  total: number;
}