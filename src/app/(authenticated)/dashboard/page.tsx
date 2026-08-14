'use client';

import { useEffect, useState } from 'react';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { MetricCard } from './_components/MetricCard';
import { DashboardAfterServicePhotos } from './_components/DashboardAfterServicePhotos';
import { DashboardTechniciansProgress } from './_components/DashboardTechniciansProgress';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Clock, Waves } from 'lucide-react';

import { useUserStore } from '@/store/user';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const formatMonthlyPayment = (payment: string | number | undefined) => {
  if (payment === undefined) return 'US$ 0.00';
  const amount = typeof payment === 'string' ? parseFloat(payment.replace(/\D/g, '')) : payment;
  return `US$ ${(amount / 100).toFixed(2)}`;
};

export default function Page() {
  const [ showConfidential, setShowConfidential ] = useState(false);
  const { dashboard } = useUserStore((state) => state);
  const { width } = useWindowDimensions();
  const user = useUserStore((state) => state.user);

  const router = useRouter();
  const { filterCleaningPunctuality, poolsWithoutAssignment, recentIssues, lastServices, techniciansProgress } = dashboard;
  const filterCleaningWithPools = filterCleaningPunctuality?.filter((tech) => tech.assignedPools > 0) ?? [];

  const toggleConfidential = () => setShowConfidential(!showConfidential);

   // Auth check
   useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  // width is undefined until mount — do not default to 0 or we paint the mobile tree first, then remount desktop (double image work).
  if (width !== undefined && width < 1024) {
    return (
      <div className="p-4 pb-20">
        <div className="flex flex-col gap-4">
          <DashboardAfterServicePhotos services={lastServices} compact />
          <DashboardTechniciansProgress techniciansProgress={techniciansProgress} compact />

          {/* Recent Issues */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#364D9D]" />
                <h2 className="text-md font-semibold text-gray-900">Recent Issues</h2>
              </div>
              <Button 
                onClick={() => router.push('/requests')}
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                View All Requests
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4">
              {dashboard.recentIssues?.length > 0 ? (
                dashboard.recentIssues.slice(0, 3).map((issue) => (
                  <div key={issue.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{issue.client}</div>
                        <div className="text-sm text-gray-600 line-clamp-2">{issue.description}</div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className="text-xs text-gray-500">{format(new Date(issue.date), 'MMM dd')}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    <p className="font-medium mb-1">No pending issues yet</p>
                    <p>Issues will appear here as your team reports them during service visits.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter Cleaning Punctuality */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#364D9D]" />
                <h2 className="text-md font-semibold text-gray-900">Filter Cleaning Punctuality</h2>
              </div>
              <Button 
                onClick={() => router.push('/reports')}
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                View Reports
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4">
              {filterCleaningWithPools.length > 0 ? (
                filterCleaningWithPools.slice(0, 3).map((tech) => (
                  <div key={tech.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{tech.technician}</div>
                        <div className="text-sm text-gray-600">{tech.assignedPools} pools assigned</div>
                      </div>
                      <div className="ml-3 text-right">
                        <div className={`text-sm font-semibold ${
                          tech.onTimePercentage >= 90 ? 'text-green-600' : 
                          tech.onTimePercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {tech.onTimePercentage}% on time
                        </div>
                        <div className={`text-xs mt-1 px-2 py-1 rounded-full font-medium ${
                          tech.overdueCount === 0 ? 'bg-green-100 text-green-800' :
                          tech.overdueCount <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tech.overdueCount} overdue
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    <p className="font-medium mb-1">No filter cleaning data yet</p>
                    <p>Performance metrics will appear here once your technicians start completing filter cleanings.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pools Without Assignment */}
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-[#364D9D]" />
                <h2 className="text-md font-semibold text-gray-900">Pools Without Assignment</h2>
              </div>
              <Button 
                onClick={() => router.push('/clients')}
                size="sm"
                className="flex items-center gap-1 whitespace-nowrap"
              >
                View All Clients
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {dashboard.poolsWithoutAssignment?.length > 0 ? (
                dashboard.poolsWithoutAssignment.map((pool) => (
                  <div
                    key={pool.id}
                    className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => router.push(`/clients/${pool.clientId}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{pool.clientName}</div>
                        <div className="text-sm text-gray-600 mb-1">{pool.poolName}</div>
                        <div className="text-xs text-gray-500 line-clamp-1">{pool.address}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-sm">
                    <p className="font-medium mb-1">All pools have assignments</p>
                    <p>Great! All your pools are currently assigned to technicians.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Separator */}
      <div className="mb-8 h-1 w-full bg-gradient-to-r from-blue-100 via-blue-400 to-blue-100 rounded-full" />

      <DashboardAfterServicePhotos services={lastServices} />
      <DashboardTechniciansProgress techniciansProgress={techniciansProgress} />

      {/* Recent Issues Table */}
      <div className="mb-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-[#364D9D]" />
              <h2 className="text-xl font-semibold text-gray-900">Recent Pending Issues</h2>
            </div>
            <Button 
              onClick={() => router.push('/requests')}
              className="flex items-center gap-2"
            >
              View All Requests
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Technician</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                </tr>
              </thead>
              <tbody>
                {recentIssues?.length > 0 ? (
                  recentIssues.map((issue) => (
                    <tr key={issue.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">{issue.client}</td>
                      <td className="py-3 px-4 text-gray-600 flex">{format(new Date(issue.date), 'MMM dd, yyyy hh:mma')}</td>
                      <td className="py-3 px-4 text-gray-600">{issue.technician}</td>
                      <td className="py-3 px-4 text-gray-600">{issue.description}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">Issues will appear here as your team reports them during service visits.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filter Cleaning Punctuality Section */}
      <div className="mb-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-[#364D9D]" />
              <h2 className="text-xl font-semibold text-gray-900">Filter Cleaning Punctuality</h2>
            </div>
            <Button 
              onClick={() => router.push('/reports/team')}
              className="flex items-center gap-2"
            >
              View Reports
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Technician</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">On Time %</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Overdue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned Pools</th>
                </tr>
              </thead>
              <tbody>
                {filterCleaningWithPools.length > 0 ? (
                  filterCleaningWithPools.map((tech) => (
                    <tr key={tech.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-900 font-medium">{tech.technician}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            tech.onTimePercentage >= 90 ? 'text-green-600' : 
                            tech.onTimePercentage >= 80 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {tech.onTimePercentage}%
                          </span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                tech.onTimePercentage >= 90 ? 'bg-green-500' : 
                                tech.onTimePercentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${tech.onTimePercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tech.overdueCount === 0 ? 'bg-green-100 text-green-800' :
                          tech.overdueCount <= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {tech.overdueCount} overdue
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{tech.assignedPools} pools</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">Performance metrics will appear here once your technicians start completing filter cleanings.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pools Without Assignment Section */}
      <div className="mb-8">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-[#364D9D]" />
              <h2 className="text-xl font-semibold text-gray-900">Pools Without Assignment</h2>
            </div>
            <Button 
              onClick={() => router.push('/clients')}
              className="flex items-center gap-2"
            >
              View All Clients
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Client Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Pool Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Address</th>
                </tr>
              </thead>
              <tbody>
                {poolsWithoutAssignment?.length > 0 ? (
                  poolsWithoutAssignment.map((pool) => (
                    <tr
                      key={pool.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/clients/${pool.clientId}`)}
                    >
                      <td className="py-3 px-4 text-gray-900 font-medium">{pool.clientName}</td>
                      <td className="py-3 px-4 text-gray-600">{pool.poolName}</td>
                      <td className="py-3 px-4 text-gray-600">{pool.address}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-12 text-center">
                      <div className="text-gray-500">
                        <p className="text-sm">Great! All your pools are currently assigned to technicians.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
