import { messagingStatusClassName, messagingStatusLabel } from './labels';

type Props = {
  status: string;
};

export function MessageStatusBadge({ status }: Props) {
  return (
    <div
      className={`inline-flex max-w-28 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold ${messagingStatusClassName(status)}`}
    >
      {messagingStatusLabel(status)}
    </div>
  );
}
