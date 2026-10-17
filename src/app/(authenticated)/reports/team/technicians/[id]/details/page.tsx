'use client';

import { ArrowLeft, Table, Calendar, MapPin, User, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';
import { useGetTechnicianPerformance } from '@/hooks/react-query/reports/useGetTechnicianPerformance';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function TechnicianDetailsPage({ params }: { params: { id: string } }) {
  const { data: performanceData, isLoading, error } = useGetTechnicianPerformance();

  // Filter data for the specific technician
  const technicianData = performanceData?.data?.report?.filter(
    item => item.assignmentTo.id === params.id
  ) || [];

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
  const technician = technicianData.length > 0 ? {
    id: params.id,
    name: `${technicianData[0].assignmentTo.firstName} ${technicianData[0].assignmentTo.lastName}`
  } : {
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
        return <Badge variant="default" className="bg-green-100 text-green-800">On Time</Badge>;
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
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-red-600">Error loading technician data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/reports/team/technicians">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Technicians
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Table className="h-6 w-6 text-[#364D9D]" />
          Filter Cleaning Details - {technician.name}
        </h1>
        <p className="text-gray-600 mt-2">
          Detailed view of all pools and their filter cleaning status
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[#364D9D]" />
              Technician Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Name</p>
                <p className="font-medium">{technician.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Pools:</span>
                <span className="font-medium">{technicianData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">On Time:</span>
                <span className="font-medium text-green-600">
                  {technicianData.filter(item => 
                    item.lastCleaningDate !== null && 
                    (item.status.toLowerCase() === 'on time' || item.status.toLowerCase() === 'ontime')
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Overdue:</span>
                <span className="font-medium text-red-600">
                  {technicianData.filter(item => 
                    item.lastCleaningDate === null || 
                    item.status.toLowerCase() === 'overdue' ||
                    (item.status.toLowerCase() !== 'on time' && item.status.toLowerCase() !== 'ontime')
                  ).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#364D9D]" />
              Filter Cleaning Schedule
            </CardTitle>
            <CardDescription>
              All pools assigned to {technician.name} and their filter cleaning status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedTechnicianData.length === 0 ? (
              <div className="text-center py-8">
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
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{item.clientName}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{getFullAddress(item.address, item.city, item.state, item.zip)}</span>
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
                            <span className={`text-sm font-medium ${
                              item.overdueDays > 0 ? 'text-red-600' :
                              getDaysUntilNext(item.nextCleaningDate)! <= 3 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {item.overdueDays > 0 
                                ? `${item.overdueDays} days overdue`
                                : `${getDaysUntilNext(item.nextCleaningDate)} days`
                              }
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-500">Not informed</span>
                          )}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(item.status, item.lastCleaningDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 