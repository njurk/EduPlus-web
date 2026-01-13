export interface BaseEntity {
  id: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  data: T[];
}