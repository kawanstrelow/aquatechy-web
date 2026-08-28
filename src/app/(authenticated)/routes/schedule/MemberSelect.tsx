import { useShallow } from 'zustand/react/shallow';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select';
import { cn } from '@/lib/utils';
import { useMembersStore } from '@/store/members';
import { useUserStore } from '@/store/user';

type Props = {
  onChange: (value: string) => void;
  value?: string;
  showAllOption?: boolean;
  className?: string;
};

export default function MemberSelect({ onChange, value, showAllOption, className }: Props) {
  const { assignedToId, members } = useMembersStore(
    useShallow((state) => ({
      assignedToId: state.assignedToId,
      members: state.members
    }))
  );

  const user = useUserStore((state) => state.user);

  function handleChange(memberId: string) {
    onChange(memberId);
  }

  return (
    <div className={cn('mt-2', className)}>
      <Select onValueChange={handleChange} value={value ?? assignedToId}>
        <SelectTrigger data-testid="select-member">
          <SelectValue placeholder="Member" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {showAllOption && <SelectItem value="all">All technicians</SelectItem>}
            {members
              .filter(
                (member, index, self) =>
                  // Keep only the first occurrence of each member ID
                  index === self.findIndex((m) => m.id === member.id)
              )
              .map(
                (member) =>
                  member.id !== user.id &&
                  member.firstName !== '' && (
                    <SelectItem key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </SelectItem>
                  )
              )}
            {
              <SelectItem value={user.id}>
                {user.firstName} {user.lastName}
              </SelectItem>
            }
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
