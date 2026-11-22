import { z } from 'zod';

export const editRequestSchema = z.object({
  status: z.enum([
    'Pending',
    'Processing',
    'Done',
    'ClientNotified',
    'WaintingClientApproval',
    'ApprovedByClient',
    'RejectedByClient'
  ]),
  outcome: z.string().optional()
});

export type EditRequest = z.infer<typeof editRequestSchema>;

export type DeleteRequest = {
  id: string;
};
