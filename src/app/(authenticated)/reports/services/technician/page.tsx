'use client';

import { format } from 'date-fns';
import { Building2, CalendarIcon, Download } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useUserStore } from '@/store/user';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useGenerateTechnicianReport } from '@/hooks/react-query/reports/useGenerateTechnicianReport';
import { useGetServiceTypes } from '@/hooks/react-query/service-types/useGetServiceTypes';
import { MultiSelect } from '@/components/MultiSelect';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { ReportHeader } from '../../_components/ReportChrome';

const fieldControlClass = 'border border-slate-200 bg-white text-ink shadow-none hover:bg-slate-50';

const MAX_ADJUSTMENT_DESCRIPTION_LENGTH = 120;

/** Local calendar date as YYYY-MM-DD (avoids UTC day-shift from toISOString). */
const toLocalDateString = (date: Date) => format(date, 'yyyy-MM-dd');

export default function TechnicianReportPage() {
  const user = useUserStore((state) => state.user);
  const { data: members, isLoading: membersLoading } = useGetMembersOfAllCompaniesByUserId(user.id);
  const generateReportMutation = useGenerateTechnicianReport();

  // define 'from' como 1 dia antes do 'to'
  const defaultFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 2);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const defaultTo = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | undefined>(defaultFrom);
  const [toDate, setToDate] = useState<Date | undefined>(defaultTo);
  const [fromDateString, setFromDateString] = useState<string | undefined>(toLocalDateString(defaultFrom));
  const [toDateString, setToDateString] = useState<string | undefined>(toLocalDateString(defaultTo));

  const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>([]);
  const [serviceTypePayments, setServiceTypePayments] = useState<{
    [key: string]: {
      calculateMethod: 'amount' | 'percentage';
      paymentAmountPerService?: number | string;
      paymentPercentagePerService?: number | string;
    };
  }>({});
  const [extrasAmount, setExtrasAmount] = useState<number | string>('');
  const [extrasDescription, setExtrasDescription] = useState('');
  const [discountsAmount, setDiscountsAmount] = useState<number | string>('');
  const [discountsDescription, setDiscountsDescription] = useState('');
  const { data: serviceTypesData, isLoading: isServiceTypesLoading } = useGetServiceTypes(selectedCompany || '');
  // Get unique companies from members
  const companies = useMemo(() => {
    if (!members) return [];
    const uniqueCompanies = new Map();
    members.forEach((member) => {
      if (!uniqueCompanies.has(member.company.id)) {
        uniqueCompanies.set(member.company.id, {
          id: member.company.id,
          name: member.company.name
        });
      }
    });
    return Array.from(uniqueCompanies.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }, [members]);

  // Filter technicians based on selected company
  const filteredTechnicians = useMemo(() => {
    if (!members) return [];
    const list = !selectedCompany ? members : members.filter((member) => member.company.id === selectedCompany);
    return [...list].sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`;
      const nameB = `${b.firstName} ${b.lastName}`;
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });
  }, [members, selectedCompany]);

  // Filter Type of service based on selected company
  const filteredTypeOfService = useMemo(() => {
    if (!serviceTypesData?.serviceTypes) return [];
    return serviceTypesData.serviceTypes
      .filter((service) => service.isActive)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [serviceTypesData]);

  // Handle service type selection and initialize payment values
  const handleServiceTypesChange = (newSelectedTypes: string[]) => {
    setSelectedServiceTypes(newSelectedTypes);

    // Initialize payment values for new service types
    const newPayments = { ...serviceTypePayments };
    newSelectedTypes.forEach((serviceTypeId) => {
      if (!newPayments[serviceTypeId]) {
        newPayments[serviceTypeId] = {
          calculateMethod: 'amount',
          paymentAmountPerService: 0,
          paymentPercentagePerService: 0
        };
      }
    });

    // Remove payment values for deselected service types
    Object.keys(newPayments).forEach((serviceTypeId) => {
      if (!newSelectedTypes.includes(serviceTypeId)) {
        delete newPayments[serviceTypeId];
      }
    });

    setServiceTypePayments(newPayments);
  };

  // Handle payment method change
  const handlePaymentMethodChange = (serviceTypeId: string, method: 'amount' | 'percentage') => {
    setServiceTypePayments(
      (prev: {
        [key: string]: {
          calculateMethod: 'amount' | 'percentage';
          paymentAmountPerService?: number | string;
          paymentPercentagePerService?: number | string;
        };
      }) => ({
        ...prev,
        [serviceTypeId]: {
          ...prev[serviceTypeId],
          calculateMethod: method,
          paymentAmountPerService: method === 'amount' ? prev[serviceTypeId]?.paymentAmountPerService || 0 : undefined,
          paymentPercentagePerService:
            method === 'percentage' ? prev[serviceTypeId]?.paymentPercentagePerService || 0 : undefined
        }
      })
    );
  };

  // Handle payment amount change
  const handlePaymentAmountChange = (serviceTypeId: string, value: string) => {
    setServiceTypePayments(
      (prev: {
        [key: string]: {
          calculateMethod: 'amount' | 'percentage';
          paymentAmountPerService?: number | string;
          paymentPercentagePerService?: number | string;
        };
      }) => ({
        ...prev,
        [serviceTypeId]: {
          ...prev[serviceTypeId],
          paymentAmountPerService: value === '' ? '' : parseFloat(value) || 0
        }
      })
    );
  };

  // Handle payment percentage change
  const handlePaymentPercentageChange = (serviceTypeId: string, value: string) => {
    setServiceTypePayments(
      (prev: {
        [key: string]: {
          calculateMethod: 'amount' | 'percentage';
          paymentAmountPerService?: number | string;
          paymentPercentagePerService?: number | string;
        };
      }) => ({
        ...prev,
        [serviceTypeId]: {
          ...prev[serviceTypeId],
          paymentPercentagePerService: value === '' ? '' : parseFloat(value) || 0
        }
      })
    );
  };

  const handleGenerateReport = async () => {
    try {
      // Create the service types array with payment configuration
      const serviceTypesWithPayments = selectedServiceTypes.map((serviceTypeId) => {
        const payment = serviceTypePayments[serviceTypeId];
        const serviceType = filteredTypeOfService.find((s) => s.id === serviceTypeId);
        return {
          serviceTypeId,
          serviceTypeName: serviceType?.name || 'Unknown Service',
          calculateMethod: payment.calculateMethod,
          ...(payment.calculateMethod === 'amount' && {
            paymentAmountPerService: parsePaymentValue(payment.paymentAmountPerService) ?? 0
          }),
          ...(payment.calculateMethod === 'percentage' && {
            paymentPercentagePerService: parsePaymentValue(payment.paymentPercentagePerService) ?? 0
          })
        };
      });

      const extrasValue = parsePaymentValue(extrasAmount);
      const discountsValue = parsePaymentValue(discountsAmount);

      await generateReportMutation.mutateAsync({
        assignedToId: selectedTechnician,
        companyId: selectedCompany,
        serviceTypes: serviceTypesWithPayments,
        fromDate: fromDateString!,
        toDate: toDateString!,
        ...(extrasValue !== null &&
          extrasValue > 0 && {
            extras: {
              amount: extrasValue,
              description: extrasDescription.trim()
            }
          }),
        ...(discountsValue !== null &&
          discountsValue > 0 && {
            discounts: {
              amount: discountsValue,
              description: discountsDescription.trim()
            }
          })
      });
      setSelectedServiceTypes([]);
      setServiceTypePayments({});
      setExtrasAmount('');
      setExtrasDescription('');
      setDiscountsAmount('');
      setDiscountsDescription('');
    } catch (error) {
      console.error('Error generating report:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate report. Please try again.');
    }
  };

  // Helper function to safely parse payment values
  const parsePaymentValue = (value: number | string | undefined): number | null => {
    if (value === '' || value === undefined) return null;
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(parsed) ? null : parsed;
  };

  const validateAdjustment = (amount: number | string, description: string) => {
    const parsedAmount = parsePaymentValue(amount);
    if (parsedAmount === null || parsedAmount === 0) {
      return true;
    }
    if (parsedAmount < 0) {
      return false;
    }
    const trimmedDescription = description.trim();
    return trimmedDescription.length > 0 && trimmedDescription.length <= MAX_ADJUSTMENT_DESCRIPTION_LENGTH;
  };

  // Validation function for payment configuration
  const validatePaymentConfiguration = () => {
    for (const serviceTypeId of selectedServiceTypes) {
      const payment = serviceTypePayments[serviceTypeId];
      if (!payment) return false;

      if (payment.calculateMethod === 'amount') {
        const amount = parsePaymentValue(payment.paymentAmountPerService);
        // Require a filled, positive amount (0 or empty is not valid)
        if (amount === null || amount <= 0) {
          return false;
        }
      } else if (payment.calculateMethod === 'percentage') {
        const percentage = parsePaymentValue(payment.paymentPercentagePerService);
        // Require a filled percentage in valid range (empty is not valid)
        if (percentage === null || percentage < 0 || percentage > 100) {
          return false;
        }
      }
    }
    return true;
  };

  const canGenerateReport =
    selectedCompany &&
    selectedTechnician &&
    selectedServiceTypes.length > 0 &&
    validatePaymentConfiguration() &&
    validateAdjustment(extrasAmount, extrasDescription) &&
    validateAdjustment(discountsAmount, discountsDescription);

  if (membersLoading || isServiceTypesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title="Service report by technician"
        description="Download a PDF of completed services and pay for one technician."
        backHref="/reports/services"
        backLabel="Back to service reports"
      />

      <Card className="overflow-hidden border-line bg-surface shadow-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-ink">
            <CalendarIcon className="h-5 w-5 text-accent" />
            Report filters
          </CardTitle>
          <CardDescription>Select company, technician, and date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Company
            </label>
            <Select
              value={selectedCompany}
              onValueChange={(value) => {
                setSelectedCompany(value);
                setSelectedTechnician('');
                setSelectedServiceTypes([]);
                setServiceTypePayments({});
              }}
            >
              <SelectTrigger className={fieldControlClass}>
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Technician</label>
            <Select disabled={!selectedCompany} value={selectedTechnician} onValueChange={setSelectedTechnician}>
              <SelectTrigger className={fieldControlClass}>
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {filteredTechnicians?.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Service types</label>
            <MultiSelect
              disabled={!selectedCompany}
              options={filteredTypeOfService.map((service) => ({
                label: service.name,
                value: service.id
              }))}
              selected={selectedServiceTypes}
              onChange={handleServiceTypesChange}
              placeholder="Select service types"
              className="w-full"
            />
          </div>

          {/* Payment configuration for selected service types */}
          {selectedServiceTypes.length > 0 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">Payment Configuration</label>
              {selectedServiceTypes.map((serviceTypeId) => {
                const serviceType = filteredTypeOfService.find((s) => s.id === serviceTypeId);
                const payment = serviceTypePayments[serviceTypeId];
                return (
                  <div key={serviceTypeId} className="space-y-3 rounded-lg border border-line bg-canvas p-4">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {serviceType?.name || 'Unknown Service'}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Selection */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Payment Method</label>
                      <Select
                        value={payment?.calculateMethod || 'amount'}
                        onValueChange={(value: 'amount' | 'percentage') =>
                          handlePaymentMethodChange(serviceTypeId, value)
                        }
                      >
                        <SelectTrigger className={`w-full ${fieldControlClass}`}>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="amount">Fixed amount per service</SelectItem>
                          <SelectItem value="percentage">Percentage of the pool's monthly payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Payment Input */}
                    <div className="space-y-2">
                      {payment?.calculateMethod === 'amount' ? (
                        <>
                          <label className="text-xs font-medium text-gray-600">Amount paid per Service (US$)</label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">$</span>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={payment.paymentAmountPerService || ''}
                              onChange={(e) => handlePaymentAmountChange(serviceTypeId, e.target.value)}
                              className={`text-sm ${
                                (() => {
                                  const amount = parsePaymentValue(payment.paymentAmountPerService);
                                  return amount !== null && amount < 0;
                                })()
                                  ? 'border-red-500 focus:border-red-500'
                                  : ''
                              }`}
                            />
                          </div>
                          {(() => {
                            const amount = parsePaymentValue(payment.paymentAmountPerService);
                            return amount !== null && amount < 0;
                          })() && <p className="text-xs text-red-500">Amount cannot be negative</p>}

                          {/* Explanation text for Pool Cleaning with amount payment */}
                          {payment?.calculateMethod === 'amount' && serviceType?.name === 'Pool Cleaning' && (
                            <div className="mt-2 rounded-md bg-blue-50 p-2">
                              <p className="text-xs text-blue-700">
                                <strong>How it works:</strong> Services will be calculated considering payment unit
                                settled in the pool multiplied by the fixed amount set here.
                              </p>
                              <p className="mt-1 text-xs text-blue-700">
                                <strong>Example:</strong> If you set $10.00 here and Pool A has 2 payment units while
                                Pool B has 3 payment units, Pool A will pay $20.00 per service (2 × $10.00) and Pool B
                                will pay $30.00 per service (3 × $10.00).
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <label className="text-xs font-medium text-gray-600">Percentage per Service (%)</label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0.0"
                              value={payment.paymentPercentagePerService || ''}
                              onChange={(e) => handlePaymentPercentageChange(serviceTypeId, e.target.value)}
                              className={`text-sm ${
                                (() => {
                                  const percentage = parsePaymentValue(payment.paymentPercentagePerService);
                                  return percentage !== null && (percentage < 0 || percentage > 100);
                                })()
                                  ? 'border-red-500 focus:border-red-500'
                                  : ''
                              }`}
                            />
                            <span className="text-sm text-gray-500">%</span>
                          </div>
                          {(() => {
                            const percentage = parsePaymentValue(payment.paymentPercentagePerService);
                            return percentage !== null && (percentage < 0 || percentage > 100);
                          })() && <p className="text-xs text-red-500">Percentage must be between 0 and 100</p>}

                          {/* Explanation text for percentage calculation */}
                          {payment?.calculateMethod === 'percentage' && (
                            <div className="mt-2 rounded-md bg-blue-50 p-2">
                              <p className="text-xs text-blue-700">
                                <strong>How it works:</strong> Enter the percentage of the pool's monthly payment that
                                should be paid per service. For example, if you want to pay 70% of the monthly payment
                                for weekly services, enter <strong>16.2%</strong> (70% ÷ 4.33 weeks).
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4">
            <label className="block text-sm font-medium">Payment Adjustments (Optional)</label>
            <p className="text-xs text-gray-500">
              Add extras or discounts to the report total. Leave amount at 0 to skip.
            </p>

            <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
              <span className="text-sm font-medium text-gray-800">Extras</span>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Amount (US$)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={extrasAmount}
                    onChange={(e) => setExtrasAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`text-sm ${
                      parsePaymentValue(extrasAmount) !== null && parsePaymentValue(extrasAmount)! < 0
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                  />
                </div>
                {parsePaymentValue(extrasAmount) !== null && parsePaymentValue(extrasAmount)! < 0 && (
                  <p className="text-xs text-red-500">Amount cannot be negative</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <Textarea
                  placeholder="e.g. Holiday route coverage bonus"
                  value={extrasDescription}
                  maxLength={MAX_ADJUSTMENT_DESCRIPTION_LENGTH}
                  onChange={(e) => setExtrasDescription(e.target.value)}
                  className={`min-h-[72px] text-sm ${
                    parsePaymentValue(extrasAmount) !== null &&
                    parsePaymentValue(extrasAmount)! > 0 &&
                    extrasDescription.trim().length === 0
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {parsePaymentValue(extrasAmount) !== null &&
                      parsePaymentValue(extrasAmount)! > 0 &&
                      extrasDescription.trim().length === 0 && (
                        <span className="text-red-500">Description is required when amount is greater than 0</span>
                      )}
                  </span>
                  <span>
                    {extrasDescription.length}/{MAX_ADJUSTMENT_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-line bg-canvas p-4">
              <span className="text-sm font-medium text-gray-800">Discounts</span>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Amount (US$)</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={discountsAmount}
                    onChange={(e) => setDiscountsAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`text-sm ${
                      parsePaymentValue(discountsAmount) !== null && parsePaymentValue(discountsAmount)! < 0
                        ? 'border-red-500 focus:border-red-500'
                        : ''
                    }`}
                  />
                </div>
                {parsePaymentValue(discountsAmount) !== null && parsePaymentValue(discountsAmount)! < 0 && (
                  <p className="text-xs text-red-500">Amount cannot be negative</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Description</label>
                <Textarea
                  placeholder="e.g. Credit adjustment for missed service"
                  value={discountsDescription}
                  maxLength={MAX_ADJUSTMENT_DESCRIPTION_LENGTH}
                  onChange={(e) => setDiscountsDescription(e.target.value)}
                  className={`min-h-[72px] text-sm ${
                    parsePaymentValue(discountsAmount) !== null &&
                    parsePaymentValue(discountsAmount)! > 0 &&
                    discountsDescription.trim().length === 0
                      ? 'border-red-500 focus:border-red-500'
                      : ''
                  }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {parsePaymentValue(discountsAmount) !== null &&
                      parsePaymentValue(discountsAmount)! > 0 &&
                      discountsDescription.trim().length === 0 && (
                        <span className="text-red-500">Description is required when amount is greater than 0</span>
                      )}
                  </span>
                  <span>
                    {discountsDescription.length}/{MAX_ADJUSTMENT_DESCRIPTION_LENGTH}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">From Date</label>
            <DatePicker
              placeholder="Select start date"
              value={fromDate}
              className={`w-full ${fieldControlClass}`}
              onChange={(date) => {
                if (date) {
                  const startOfDay = new Date(date);
                  startOfDay.setHours(0, 0, 0, 0);
                  setFromDate(startOfDay);
                  setFromDateString(toLocalDateString(startOfDay));
                } else {
                  setFromDate(undefined);
                  setFromDateString(undefined);
                }
              }}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">To Date</label>
            <DatePicker
              placeholder="Select end date"
              value={toDate}
              className={`w-full ${fieldControlClass}`}
              onChange={(date) => {
                if (date) {
                  const endOfDay = new Date(date);
                  endOfDay.setHours(23, 59, 59, 999);
                  setToDate(endOfDay);
                  setToDateString(toLocalDateString(endOfDay));
                } else {
                  setToDate(undefined);
                  setToDateString(undefined);
                }
              }}
            />
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={!canGenerateReport || generateReportMutation.isPending}
            className="flex w-full items-center gap-2 border border-accent"
          >
            <Download className="h-4 w-4" />
            {generateReportMutation.isPending ? 'Generating PDF...' : 'Generate & Download PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
