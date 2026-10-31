'use client';

import { Calendar, Filter, MapPin } from 'lucide-react';
import { format } from 'date-fns';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetTechnicianPerformance } from '@/hooks/react-query/reports/useGetTechnicianPerformance';

import { ReportHeader } from '../../../../_components/ReportChrome';

export default function TechnicianDetailsPage({ params }: { params: { id: string } }) {
  const { data: performanceData, isLoading, error } = useGetTechnicianPerformance();

  // Filter data for the specific technician
  const technicianData = performanceData?.data?.report?.filter((item) => item.assignmentTo.id === params.id) || [];

  // Sort data by overdue days (most overdue first, then least, then not informed)
  const sortedTechnicianData = [...technicianData].sort((a, b) => {
    // If both have null lastCleaningDate, sort by overdueDays
    if (a.lastCleaningDate === null && b.lastCleaningDate === null) {
      return b.overdueDays - a.overdueDays;
    }

    // If only a has null lastCleaningDate, put it after
    if (a.lastCleaningDate === null) {
      return 1;
    }

    // If only b has null lastCleaningDate, put it after
    if (b.lastCleaningDate === null) {
      return -1;
    }

    // Both have dates, sort by overdueDays (most overdue first)
    return b.overdueDays - a.overdueDays;
  });

  // Get technician info from the first record (if available)
  const technician =
    technicianData.length > 0
      ? {
          id: params.id,
          name: `${technicianData[0].assignmentTo.firstName} ${technicianData[0].assignmentTo.lastName}`
        }
      : {
          id: params.id,
          name: 'Unknown Technician'
        };

  const getStatusBadge = (status: string, lastCleaningDate: string | null) => {
    // If lastCleaningDate is null, consider it overdue
    if (lastCleaningDate === null) {
      return <Badge variant="destructive">Overdue</Badge>;
    }

    switch (status.toLowerCase()) {
      case 'on time':
      case 'ontime':
        return (
          <Badge variant="default" className="border border-success/20 bg-success-soft text-success">
            On Time
          </Badge>
        );
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        // Everything else is considered overdue
        return <Badge variant="destructive">Overdue</Badge>;
    }
  };

  const getDaysUntilNext = (nextCleaningDate: string | null) => {
    if (nextCleaningDate === null) return null;

    const today = new Date();
    const next = new Date(nextCleaningDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getFullAddress = (address: string, city: string, state: string, zip: string) => {
    return `${address}, ${city}, ${state} ${zip}`;
  };

  const formatDate = (dateString: string | null) => {
    if (dateString === null) return 'Not informed';
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-line bg-surface px-5 py-8 text-center text-sm text-danger shadow-lift">
        Error loading technician data
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ReportHeader
        title={`Filter cleaning details — ${technician.name}`}
        description="Pools assigned to this technician and their filter cleaning status"
        backHref="/reports/team/technicians"
        backLabel="Back to technicians"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-line bg-surface shadow-lift">
          <CardHeader>
            <CardTitle className="text-base text-ink">Technician</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-muted">Name</p>
            <p className="font-medium text-ink">{technician.name}</p>
          </CardContent>
        </Card>

        <Card className="border-line bg-surface shadow-lift">
          <CardHeader>
            <CardTitle className="text-base text-ink">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">Total pools</span>
                <span className="font-medium text-ink">{technicianData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">On time</span>
                <span className="font-medium text-success">
                  {
                    technicianData.filter(
                      (item) =>
                        item.lastCleaningDate !== null &&
                        (item.status.toLowerCase() === 'on time' || item.status.toLowerCase() === 'ontime')
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Overdue</span>
                <span className="font-medium text-danger">
                  {
                    technicianData.filter(
                      (item) =>
                        item.lastCleaningDate === null ||
                        item.status.toLowerCase() === 'overdue' ||
                        (item.status.toLowerCase() !== 'on time' && item.status.toLowerCase() !== 'ontime')
                    ).length
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-line bg-surface shadow-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-accent" />
            Filter Cleaning Schedule
          </CardTitle>
          <CardDescription>All pools assigned to {technician.name} and their filter cleaning status</CardDescription>
        </CardHeader>
        <CardContent>
          {sortedTechnicianData.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No filter cleaning data available for this technician</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-surface">
                  <tr className="border-b border-line bg-surface">
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Client</th>
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Address</th>
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Last Cleaning</th>
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Next Cleaning</th>
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Days Until</th>
                    <th className="bg-surface p-3 text-left font-medium text-ink-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTechnicianData.map((item, index) => (
                    <tr key={index} className="border-b border-line hover:bg-canvas">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{item.clientName}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {getFullAddress(item.address, item.city, item.state, item.zip)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(item.lastCleaningDate)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{formatDate(item.nextCleaningDate)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {item.nextCleaningDate ? (
                          <span
                            className={`text-sm font-medium ${
                              item.overdueDays > 0
                                ? 'text-red-600'
                                : getDaysUntilNext(item.nextCleaningDate)! <= 3
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                            }`}
                          >
                            {item.overdueDays > 0
                              ? `${item.overdueDays} days overdue`
                              : `${getDaysUntilNext(item.nextCleaningDate)} days`}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-500">Not informed</span>
                        )}
                      </td>
                      <td className="p-3">{getStatusBadge(item.status, item.lastCleaningDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
