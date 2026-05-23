'use client';

import { PlusIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { X } from 'lucide-react';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import SelectField from '@/components/SelectField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import useGetProductCategories from '@/hooks/react-query/products/useGetProductCategories';
import useGetProducts from '@/hooks/react-query/products/useGetProducts';
import { useCreateProduct } from '@/hooks/react-query/products/useCreateProduct';
import { useUpdateProduct } from '@/hooks/react-query/products/useUpdateProduct';
import { useCreateProductCategory } from '@/hooks/react-query/products/useCreateProductCategory';
import { useUserStore } from '@/store/user';
import { CompanyWithMyRole } from '@/ts/interfaces/Company';
import { CreateProductCategoryRequest, CreateProductRequest, ProductListRow, UpdateProductRequest } from '@/ts/interfaces/Product';

import { ProductCategoryFormDialog } from './_components/ProductCategoryFormDialog';
import { ProductFormDialog } from './_components/ProductFormDialog';
import { createColumns } from './DataTableProducts/columns';
import { DataTableProducts } from './DataTableProducts';

type FilterFormData = {
  companyId: string;
  categoryId: string;
  status: string;
  search: string;
};

const MANAGER_ROLES = ['Owner', 'Admin', 'Office'] as const;

function canManageCatalog(role?: CompanyWithMyRole['role']) {
  return !!role && MANAGER_ROLES.includes(role as (typeof MANAGER_ROLES)[number]);
}

export default function ProductsPage() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const { data: companies = [], isLoading: isLoadingCompanies } = useGetCompanies();

  const filtersForm = useForm<FilterFormData>({
    defaultValues: {
      companyId: '',
      categoryId: 'all',
      status: 'active',
      search: ''
    }
  });

  const companyId = filtersForm.watch('companyId');
  const categoryId = filtersForm.watch('categoryId');
  const status = filtersForm.watch('status');
  const search = filtersForm.watch('search');

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === companyId),
    [companies, companyId]
  );

  const canManage = canManageCatalog(selectedCompany?.role);

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  useEffect(() => {
    if (!companyId && companies.length > 0) {
      filtersForm.setValue('companyId', companies[0].id);
    }
  }, [companies, companyId, filtersForm]);

  const categoriesQuery = useGetProductCategories({ companyId });

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoriesQuery.data?.productCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [categoriesQuery.data?.productCategories]);

  const productsQuery = useGetProducts({
    companyId,
    activeOnly: status === 'active' ? true : status === 'inactive' ? false : undefined,
    categoryId: categoryId !== 'all' && categoryId !== 'uncategorized' ? categoryId : null,
    uncategorizedOnly: categoryId === 'uncategorized',
    search: search || null,
    categoryMap
  });

  const { mutateAsync: createProduct, isPending: isCreatingProduct } = useCreateProduct();
  const { mutateAsync: updateProduct, isPending: isUpdatingProduct } = useUpdateProduct(companyId);
  const { mutateAsync: createCategory, isPending: isCreatingCategory } = useCreateProductCategory();

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productDialogMode, setProductDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedProduct, setSelectedProduct] = useState<ProductListRow | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const companyOptions = useMemo(
    () =>
      companies.map((company) => ({
        key: company.id,
        value: company.id,
        name: company.name
      })),
    [companies]
  );

  const categoryOptions = useMemo(() => {
    const options = [
      { key: 'all', value: 'all', name: 'All categories' },
      { key: 'uncategorized', value: 'uncategorized', name: 'Uncategorized' }
    ];
    categoriesQuery.data?.productCategories.forEach((category) => {
      options.push({ key: category.id, value: category.id, name: category.name });
    });
    return options;
  }, [categoriesQuery.data?.productCategories]);

  const statusOptions = [
    { key: 'active', value: 'active', name: 'Active only' },
    { key: 'inactive', value: 'inactive', name: 'Inactive only' },
    { key: 'all', value: 'all', name: 'All statuses' }
  ];

  const appliedFilters = useMemo(() => {
    let count = 0;
    if (categoryId !== 'all') count++;
    if (status !== 'active') count++;
    if (search.trim()) count++;
    if (companies.length > 1 && companyId && companyId !== companies[0]?.id) count++;
    return count;
  }, [categoryId, status, search, companies, companyId]);

  const handleClearFilters = () => {
    filtersForm.reset({
      companyId: companies[0]?.id ?? '',
      categoryId: 'all',
      status: 'active',
      search: ''
    });
  };

  const handleOpenCreateProduct = () => {
    setProductDialogMode('create');
    setSelectedProduct(null);
    setProductDialogOpen(true);
  };

  const handleEditProduct = (product: ProductListRow) => {
    setProductDialogMode('edit');
    setSelectedProduct(product);
    setProductDialogOpen(true);
  };

  const handleCreateProduct = async (params: { companyId: string; data: CreateProductRequest }) => {
    await createProduct(params);
    setProductDialogOpen(false);
  };

  const handleUpdateProduct = async (productId: string, data: UpdateProductRequest) => {
    await updateProduct({ productId, data });
    setProductDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleCreateCategory = async (params: { companyId: string; data: CreateProductCategoryRequest }) => {
    await createCategory(params);
    setCategoryDialogOpen(false);
  };

  const columns = createColumns(handleEditProduct, canManage);

  if (isLoadingCompanies) return <LoadingSpinner />;

  return (
    <FormProvider {...filtersForm}>
      <div className="flex flex-col gap-6 p-2">
        <div className="flex w-full flex-wrap items-center gap-2">
          <Button type="button" className="shrink-0" onClick={handleOpenCreateProduct} disabled={!companyId}>
            <PlusIcon className="mr-2" />
            Add product
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setCategoryDialogOpen(true)}
            >
              <PlusIcon className="mr-2" />
              Add category
            </Button>
          )}
          <div className="min-w-[140px] flex-1 max-w-xs">
            <Input
              placeholder="Search by name or SKU"
              value={search}
              onChange={(event) => filtersForm.setValue('search', event.target.value)}
              className="h-10 w-full"
            />
          </div>
          {companies.length > 1 && (
            <div className="min-w-[140px] flex-1">
              <SelectField name="companyId" options={companyOptions} placeholder="Company" />
            </div>
          )}
          <div className="min-w-[140px] flex-1">
            <SelectField name="categoryId" options={categoryOptions} placeholder="Category" />
          </div>
          <div className="min-w-[140px] flex-1">
            <SelectField name="status" options={statusOptions} placeholder="Status" />
          </div>
          {appliedFilters > 0 && (
            <Button variant="outline" type="button" className="shrink-0" onClick={handleClearFilters}>
              <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                {appliedFilters}
              </span>
              Clear
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {productsQuery.isLoading ? (
          <LoadingSpinner />
        ) : (
          <DataTableProducts columns={columns} data={productsQuery.data ?? []} />
        )}

        <ProductFormDialog
          open={productDialogOpen}
          onOpenChange={setProductDialogOpen}
          mode={productDialogMode}
          product={selectedProduct}
          pageCompanyId={companyId}
          companies={companies}
          editCategories={categoriesQuery.data?.productCategories ?? []}
          canManage={canManage}
          onSubmitCreate={handleCreateProduct}
          onSubmitEdit={handleUpdateProduct}
          isLoading={isCreatingProduct || isUpdatingProduct}
        />

        <ProductCategoryFormDialog
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          pageCompanyId={companyId}
          companies={companies}
          onSubmit={handleCreateCategory}
          isLoading={isCreatingCategory}
        />
      </div>
    </FormProvider>
  );
}
