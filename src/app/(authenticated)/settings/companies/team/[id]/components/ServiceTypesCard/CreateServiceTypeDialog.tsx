'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { CreateServiceTypeRequest } from '@/ts/interfaces/ServiceTypes';
import { ChecklistTemplate } from '@/ts/interfaces/ChecklistTemplates';

const createServiceTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
  checklistTemplateId: z.string().optional()
});

interface CreateServiceTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateServiceTypeRequest) => void;
  isLoading: boolean;
  checklistTemplates: ChecklistTemplate[];
}

export function CreateServiceTypeDialog({ open, onOpenChange, onSubmit, isLoading, checklistTemplates }: CreateServiceTypeDialogProps) {
  const form = useForm<z.infer<typeof createServiceTypeSchema>>({
    resolver: zodResolver(createServiceTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      isDefault: false,
      checklistTemplateId: 'none'
    }
  });

  const handleSubmit = (data: z.infer<typeof createServiceTypeSchema>) => {
    const submitData = {
      name: data.name,
      description: data.description,
      isDefault: data.isDefault,
      defaultChecklistId: data.checklistTemplateId === 'none' ? null : data.checklistTemplateId
    };
    onSubmit(submitData);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Service Type</DialogTitle>
          <DialogDescription>
            Create a new service type to categorize your services (e.g., Pool Cleaning, Maintenance, Equipment Repair).
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pool Cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of what this service type includes..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="checklistTemplateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Checklist Template</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a checklist template (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No template</SelectItem>
                      {checklistTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.isDefault && '(Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Set as default service type
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      This service type will be selected by default for new services
                    </p>
                  </div>
                </FormItem>
              )}
            /> */}

            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Creating...' : 'Create Service Type'}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
