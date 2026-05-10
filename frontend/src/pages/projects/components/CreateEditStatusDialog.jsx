import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_CATEGORIES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];

export default function CreateEditStatusDialog({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  isLoading,
  isEditing,
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) {
          // Reset form when dialog closes
          onFormChange({
            name: '',
            category: 'todo',
            color: '#6B7280',
          });
        }
      }}
    >
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Status' : 'Create Status'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update this project status.'
              : 'Create a new status column for this project board.'}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="status-name">Status Name</Label>
            <Input
              id="status-name"
              placeholder="e.g. In Review"
              value={form.name}
              onChange={(event) =>
                onFormChange({ ...form, name: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(value) =>
                onFormChange({ ...form, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="status-color"
                type="color"
                value={form.color}
                onChange={(event) =>
                  onFormChange({ ...form, color: event.target.value })
                }
                className="h-10 w-14 p-1"
              />
              <Input
                value={form.color}
                onChange={(event) =>
                  onFormChange({ ...form, color: event.target.value })
                }
                placeholder="#6B7280"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Save Status' : 'Create Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
