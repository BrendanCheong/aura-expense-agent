export interface Category {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreate {
  userId: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface CategoryUpdate {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
}
