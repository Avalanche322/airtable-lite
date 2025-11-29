export interface Item {
  id: number;
  // flattened data fields from server.data
  title: string;
  status: string;
  score: number;
  category: string;
  created_by: string;
  assignee?: string;
  priority?: string;
  tags?: string[];
  comments?: string;
  approved?: boolean;
  type?: string;
  owner?: string;
  size?: number;
  color?: string;
  source?: string;
  rating?: number;
  location?: string;
  notes?: string;
  active?: boolean;
  created_at: string;
  [key: string]: any;
}

export interface ItemsPage {
  items: Item[];
  nextCursor: number | null;
  total: number;
}
