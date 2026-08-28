'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addDays, format } from 'date-fns';
import { Calendar, List } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { useShallow } from 'zustand/react/shallow';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useServicesContext } from '@/context/services';
import useGetMembersOfAllCompaniesByUserId from '@/hooks/react-query/companies/getMembersOfAllCompaniesByUserId';
import { useMapServicesUtils } from '@/hooks/useMapServicesUtils';
import useWindowDimensions from '@/hooks/useWindowDimensions';
import { newServiceSchema } from '@/schemas/service';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';
import { normalizeToUTC12, useWeekdayStore } from '@/store/weekday';

import Map from './Map';
import MemberSelect from './MemberSelect';
import { DialogNewService } from './ModalNewService';
import { DialogTransferMultipleServices } from './ModalTransferMultipleServices';
import { ScheduleCalendarView } from './ScheduleCalendarView';
import { ServicesList } from './ServicesList';

type DateRangeItem = { date: string; formatted: string; displayText: string };

function ScheduleListView({
  mdScreen,
  selectedDay,
  dateRange,
  assignedToId,
  onChangeDay,
  onChangeMember
}: {
  mdScreen: boolean;
  selectedDay: string;
  dateRange: DateRangeItem[];
  assignedToId: string;
  onChangeDay: (day: string) => void;
  onChangeMember: (memberId: string) => void;
}) {
  const { directions, distance, duration, isLoaded, loadError } = useMapServicesUtils();
  const { services } = useServicesContext();

  return (
    <div className={`flex w-full items-start justify-start gap-2 ${mdScreen ? 'flex-col' : ''}`}>
      <div className={`w-[50%] ${mdScreen && 'w-full'}`}>
        <div className="inline-flex w-full flex-col items-center justify-start gap-2 rounded-lg bg-gray-50 py-2">
          <form className="w-full">
            <div className="mb-4">
              <Select value={selectedDay || dateRange[7].date} onValueChange={onChangeDay}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a date" />
                </SelectTrigger>
                <SelectContent>
                  {dateRange.map((day) => (
                    <SelectItem key={day.date} value={day.date}>
                      {day.displayText}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <MemberSelect onChange={onChangeMember} value={assignedToId} />
            <div className="mb-2 mt-2 flex gap-2">
              <DialogNewService />
              <DialogTransferMultipleServices />
            </div>
          </form>

          <div className="w-full">
            <ServicesList />
          </div>
        </div>
      </div>
      <div className={`h-fit w-[50%] ${mdScreen && 'w-full'}`}>
        <Map
          services={services}
          directions={directions}
          distance={distance}
          duration={duration}
          isLoaded={isLoaded}
          loadError={loadError}
        />
      </div>
    </div>
  );
}

export default function Page() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarTechId, setCalendarTechId] = useState('all');

  const { selectedDay, setSelectedDay } = useWeekdayStore((state) => state);
  const { width = 0 } = useWindowDimensions();

  const router = useRouter();

  const { user } = useUserStore(
    useShallow((state) => ({
      user: state.user,
      isFreePlan: state.isFreePlan
    }))
  );

  useGetMembersOfAllCompaniesByUserId(user.id);

  useEffect(() => {
    if (user.firstName === '') {
      router.push('/onboarding');
    }
  }, [user, router]);

  const { assignedToId, setAssignedToid } = useMembersStore(
    useShallow((state) => ({
      assignedToId: state.assignedToId,
      setAssignedToid: state.setAssignedToid
    }))
  );

  const mdScreen = width < 900;

  const form = useForm<z.infer<typeof newServiceSchema>>({
    resolver: zodResolver(newServiceSchema),
    defaultValues: {
      assignedToId: assignedToId,
      poolId: '',
      scheduledTo: '',
      clientId: '',
      serviceTypeId: '',
      instructions: ''
    }
  });

  function handleChangeMember(memberId: string) {
    setAssignedToid(memberId);
    form.setValue('assignedToId', memberId);
  }

  function handleCalendarMemberChange(memberId: string) {
    setCalendarTechId(memberId);
    if (memberId !== 'all') {
      setAssignedToid(memberId);
      form.setValue('assignedToId', memberId);
    }
  }

  function handleViewChange(nextView: string) {
    if (nextView === 'list' && calendarTechId !== 'all') {
      setAssignedToid(calendarTechId);
      form.setValue('assignedToId', calendarTechId);
    }
    setView(nextView as 'list' | 'calendar');
  }

  function getDateRange(): DateRangeItem[] {
    const today = new Date();

    // Create array from -7 to +21 (29 days total)
    return Array.from({ length: 29 }, (_, index) => {
      // Subtract 7 from index to start 7 days ago
      const dateAt12PMUTC = normalizeToUTC12(addDays(today, index - 7).toISOString());
      const isToday = index === 7; // Today is at index 7 (7 days ago + 7 = today)
      const isPast = index < 7;

      const formattedDate = format(dateAt12PMUTC, 'EEEE, MMMM do');

      return {
        date: dateAt12PMUTC.toISOString(),
        formatted: formattedDate,
        displayText: isToday ? `Today - ${formattedDate}` : isPast ? `${formattedDate}` : `${formattedDate}`
      };
    });
  }

  function handleChangeDay(day: string) {
    setSelectedDay(day);
  }

  const dateRange = getDateRange();

  return (
    <FormProvider {...form}>
      <div className="flex h-[100%] w-full flex-col bg-gray-50 p-2">
        <Tabs value={view} onValueChange={handleViewChange} className="mb-2">
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {view === 'calendar' ? (
          <ScheduleCalendarView techFilter={calendarTechId} onTechChange={handleCalendarMemberChange} />
        ) : (
          <ScheduleListView
            mdScreen={mdScreen}
            selectedDay={selectedDay}
            dateRange={dateRange}
            assignedToId={assignedToId}
            onChangeDay={handleChangeDay}
            onChangeMember={handleChangeMember}
          />
        )}
      </div>
    </FormProvider>
  );
}

export type FormSchema = z.infer<typeof newServiceSchema>;
