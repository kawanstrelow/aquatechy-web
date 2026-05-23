export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  unit: string;
  unitPriceCents: number;
  costCents: number | null;
  isTaxable: boolean;
  defaultTaxRate: number;
  sortOrder: number;
  isActive: boolean;
  companyId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoriesResponse {
  productCategories: ProductCategory[];
}

export interface ProductsResponse {
  products: Product[];
}

export interface ProductCategoryResponse {
  productCategory: ProductCategory;
}

export interface ProductResponse {
  product: Product;
}

export type CreateProductCategoryRequest = {
  name: string;
  description?: string;
  sortOrder?: number;
};

export type CreateProductRequest = {
  name: string;
  unit: string;
  unitPriceCents: number;
  costCents?: number;
  description?: string;
  sku?: string;
  isTaxable?: boolean;
  defaultTaxRate?: number;
  categoryId?: string;
  sortOrder?: number;
};

export type UpdateProductRequest = {
  name?: string;
  unit?: string;
  unitPriceCents?: number;
  costCents?: number | null;
  description?: string | null;
  sku?: string | null;
  isTaxable?: boolean;
  defaultTaxRate?: number;
  categoryId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export type ProductListRow = Product & {
  categoryName: string;
  unitPrice: number;
  cost: number | null;
};
