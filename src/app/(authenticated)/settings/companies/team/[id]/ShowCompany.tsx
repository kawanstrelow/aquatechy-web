'use client';

import { format } from 'date-fns';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import AvatarEditor from 'react-avatar-editor';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

import { useDeleteCompany } from '@/hooks/react-query/companies/deleteCompany';
import useGetCompanies from '@/hooks/react-query/companies/getCompanies';
import { useEditCompanyLogo } from '@/hooks/react-query/companies/updateCompanyLogo';

import { Company } from '@/ts/interfaces/Company';
import { getInitials } from '@/utils/others';
import { CompanyTeamTab } from './components/CompanyTeamTab';
import CompanyInfo from './CompanyInfo';
import Preferences from './Preferences';

type Props = {
  company: Company;
};

const DELETE_CONFIRMATION = 'DELETE';

type CompanyTab = 'company_info' | 'preferences' | 'team';

function parseTab(value: string | null): CompanyTab {
  if (value === 'preferences' || value === 'team' || value === 'company_info') {
    return value;
  }
  return 'company_info';
}

export default function ShowCompany({ company }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<CompanyTab>(() => parseTab(searchParams.get('tab')));

  const selectTab = useCallback(
    (nextTab: CompanyTab) => {
      setTab(nextTab);
      const params = new URLSearchParams(searchParams.toString());
      if (nextTab === 'company_info') {
        params.delete('tab');
      } else {
        params.set('tab', nextTab);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab')));
  }, [searchParams]);

  const { data: companies } = useGetCompanies();
  const myRole = companies?.find((c) => c.id === company.id)?.role;
  const canEditLogo = myRole === 'Owner' || myRole === 'Admin' || myRole === 'Office';
  const canDeleteCompany = myRole === 'Owner' || myRole === 'Admin';

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { mutate: deleteCompany, isPending: isDeletePending } = useDeleteCompany();

  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [zoom, setZoom] = useState(1);
  const editorRef = useRef<AvatarEditor>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleSubmit, isPending } = useEditCompanyLogo();

  const handleLogoLinkClick = () => {
    if (!canEditLogo) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && canEditLogo) {
      setSelectedImage(file);
      setLogoDialogOpen(true);
    }
  };

  const handleSaveLogo = async () => {
    if (editorRef.current && selectedImage) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], selectedImage.name, { type: 'image/png' });
          handleSubmit({
            companyId: company.id,
            logo: file
          });
          setLogoDialogOpen(false);
          setSelectedImage(null);
        }
      }, 'image/png');
    }
  };

  const selectedTabStyles = 'text-gray-800 font-semibold';

  const handleDeleteCompany = () => {
    deleteCompany(
      { companyId: company.id },
      {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDeleteConfirmText('');
          router.push('/settings/companies');
        }
      }
    );
  };

  return (
    <div>
      <div className="flex flex-col items-start gap-6 self-stretch pt-2 lg:flex-row lg:pt-0">
        <div className="w-full lg:max-w-sm">
          <div className="relative flex w-full flex-col items-center justify-start gap-6 text-nowrap rounded-lg border px-6 pb-6 pt-16">
            <div className="w-[100% - 16px] absolute left-2 right-2 top-2 h-[148px] rounded bg-gradient-to-b from-sky-400 to-teal-400" />

            <div className="PhotoName flex min-h-[206px] flex-col items-center justify-start gap-2 self-stretch">
              <Avatar className="h-[140px] w-[140px]">
                <AvatarImage src={company.imageUrl || ''} alt={`${company.name} logo`} />
                <AvatarFallback className="text-xl">{getInitials(company.name)}</AvatarFallback>
              </Avatar>
              {canEditLogo && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={handleLogoLinkClick}
                    className="z-10 text-sm font-medium text-sky-600 underline underline-offset-2 hover:text-sky-700"
                  >
                    Change logo
                  </button>
                </>
              )}
              <div className="flex h-[54px] flex-col items-center justify-center gap-1 self-stretch">
                <div className="z-10 self-stretch text-wrap text-center text-xl font-semibold leading-[30px] text-gray-800">
                  {company.name}
                </div>
                <div className="text-wrap text-center text-sm font-medium text-gray-500">
                  {company.address}
                  {company.addressLine2 ? ` ${company.addressLine2}` : ''}, {company.city},{' '}
                  {company.state} {company.zip}
                </div>
              </div>
            </div>

            {canEditLogo && (
              <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Update Company Logo</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col items-center gap-4">
                    {selectedImage && (
                      <>
                        <div className="rounded-lg border p-2">
                          <AvatarEditor
                            ref={editorRef}
                            image={selectedImage}
                            width={250}
                            height={250}
                            border={0}
                            borderRadius={125}
                            color={[0, 0, 0, 0.6]}
                            scale={zoom}
                          />
                        </div>
                        <div className="w-full px-4">
                          <p className="mb-2 text-sm text-gray-500">Zoom</p>
                          <Slider value={[zoom]} onValueChange={(value) => setZoom(value[0])} min={1} max={3} step={0.1} />
                        </div>
                      </>
                    )}
                    <div className="flex w-full justify-end gap-2">
                      <Button variant="outline" onClick={() => setLogoDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveLogo} disabled={isPending}>
                        {isPending ? 'Updating...' : 'Update Logo'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            <div className="flex flex-row flex-wrap items-start justify-start gap-[18px] self-start lg:flex-col lg:flex-nowrap">
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">E-mail</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">{company.email}</div>
                </div>
              </div>
              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="self-stretch text-sm font-medium text-gray-500">Phone Number</div>
                  <div className="self-stretch text-sm font-medium text-gray-800">{company.phone}</div>
                </div>
              </div>

              <div className="inline-flex w-fit items-start justify-start gap-2">
                <div className="inline-flex shrink grow basis-0 flex-col items-start justify-center gap-1">
                  <div className="text-sm font-medium text-gray-500">Joined</div>
                  <div className="text-sm font-medium text-gray-800">
                    {format(new Date(company.createdAt), 'MMMM, dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>

            {canDeleteCompany && (
              <>
                <Separator className="self-stretch" />
                <div className="flex w-full flex-col gap-2 self-stretch">
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete company
                  </Button>
                </div>
                <Dialog
                  open={deleteDialogOpen}
                  onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) setDeleteConfirmText('');
                  }}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Delete company</DialogTitle>
                      <DialogDescription>
                        This permanently removes the company and related data such as clients and pools. This cannot be
                        undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                      <p className="text-sm text-gray-600">
                        Type <span className="font-mono font-semibold">{DELETE_CONFIRMATION}</span> to confirm.
                      </p>
                      <Input
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={DELETE_CONFIRMATION}
                        autoComplete="off"
                        aria-label="Type DELETE to confirm"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDeleteDialogOpen(false);
                            setDeleteConfirmText('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          disabled={deleteConfirmText !== DELETE_CONFIRMATION || isDeletePending}
                          onClick={handleDeleteCompany}
                        >
                          {isDeletePending ? 'Deleting…' : 'Delete permanently'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        <div className="flex w-full flex-col items-start">
          <div className="inline-flex h-full w-full flex-col items-start justify-start gap-6">
            <div className="inline-flex flex-wrap items-start justify-start gap-6 self-stretch text-nowrap md:flex-nowrap">
              {/* <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="inline-flex items-start justify-start gap-4 self-stretch">
                  <div className="inline-flex shrink grow basis-0 flex-col items-start justify-start gap-2">
                    <div className="self-stretch text-base font-medium leading-normal text-gray-500">
                      Monthly revenue
                    </div>
                    <div className="self-stretch text-[28px] font-semibold text-gray-800">$3670</div>
                  </div>
                  <div className="CircleIconBagde flex h-10 w-10 items-center justify-center gap-2 rounded-[100px] bg-gradient-to-b from-orange-500 to-yellow-400 p-2">
                    <div className="AttachMoney relative h-[18px] w-[18px]" />
                  </div>
                </div>
              </div> */}
              {/* <div className="RightBadgeStatisticCard inline-flex shrink grow basis-0 flex-col items-start justify-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
                <div className="TitleNumbers inline-flex items-start justify-start gap-4 self-stretch">
                  <div className="TitleNumbers inline-flex shrink grow basis-0 flex-col items-start justify-start gap-2">
                    <div className="self-stretch text-base font-medium leading-normal text-gray-500">Title</div>
                    <div className="self-stretch text-[28px] font-semibold text-gray-800">Description</div>
                  </div>
                  <div className="CircleIconBagde flex h-10 w-10 items-center justify-center gap-2 rounded-[100px] bg-gradient-to-b from-blue-600 to-sky-400 p-2">
                    <div className="FiSrTimeAdd relative h-[18px] w-[18px]" />
                  </div>
                </div>
              </div> */}
            </div>
            <div className="inline-flex items-start justify-start gap-4 self-stretch border-b border-gray-200">
              <div
                onClick={() => selectTab('company_info')}
                className="inline-flex flex-col items-start justify-start gap-2.5"
              >
                <div
                  className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'company_info' && selectedTabStyles}`}
                >
                  Basic Information
                </div>
                {tab === 'company_info' && <div className="Rectangle2 h-0.5 self-stretch bg-gray-800" />}
              </div>
              <div
                onClick={() => selectTab('preferences')}
                className="inline-flex flex-col items-start justify-start gap-2.5"
              >
                <div
                  className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'preferences' && selectedTabStyles}`}
                >
                  Preferences
                </div>
                {tab === 'preferences' && <div className="h-0.5 self-stretch bg-gray-800" />}
              </div>
              <div
                onClick={() => selectTab('team')}
                className="inline-flex flex-col items-start justify-start gap-2.5"
              >
                <div
                  className={`text-sm text-gray-500 hover:cursor-pointer ${tab === 'team' && selectedTabStyles}`}
                >
                  Team
                </div>
                {tab === 'team' && <div className="h-0.5 self-stretch bg-gray-800" />}
              </div>
            </div>
            {tab === 'company_info' ? (
              <CompanyInfo company={company} />
            ) : tab === 'preferences' ? (
              <Preferences company={company} />
            ) : (
              <CompanyTeamTab company={company} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
