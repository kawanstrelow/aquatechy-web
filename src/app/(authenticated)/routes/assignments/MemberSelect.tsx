import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { useMembersStore } from '@/store/members';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../../components/ui/select';
import { CompanyMember } from '@/ts/interfaces/Company';
import { useUserStore } from '@/store/user';

type Props = {
  onChange: (value: string) => void;
  defaultValue?: string;
};

export default function MemberSelect({ onChange }: Props) {
  const t = useTranslations('routes');
  const { assignmentToId, members } = useMembersStore(
    useShallow((state) => ({
      assignmentToId: state.assignmentToId,
      members: state.members
    }))
  );

  const user = useUserStore((state) => state.user);

  function handleChange(memberId: string) {
    onChange(memberId);
  }

  return (
    <div className="mt-2">
      {/* por padrão, o User logado é o tecnico selecionado */}
      <Select onValueChange={handleChange} defaultValue={assignmentToId}>
        <SelectTrigger data-testid="select-member">
          <SelectValue placeholder={t('member')} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
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
