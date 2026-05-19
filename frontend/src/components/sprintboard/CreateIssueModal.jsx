import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Folder, 
  Layers, 
  Zap, 
  CircleDashed, 
  User, 
  CalendarDays, 
  Clock 
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useProjects, useProjectMembers } from '@/hooks/useProjects';
import { useSprints } from '@/hooks/useSprints';
import { useIssueStatuses, useCreateIssue } from '@/hooks/useIssues';
import { queryKeys } from '@/hooks/queryKeys';

// Helper component for the sidebar property rows
const DetailRow = ({ icon, label, children }) => (
  <div className="flex items-center min-h-[36px] group">
    <div className="flex items-center text-[13px] text-neutral-500 w-[110px] shrink-0 font-medium">
      <span className="mr-2.5 text-neutral-400 flex items-center justify-center">{icon}</span>
      {label}
    </div>
    <div className="flex-1 flex justify-end min-w-0">
      {children}
    </div>
  </div>
);

export default function CreateIssueModal({
  open,
  onOpenChange,
  orgSlug,
  initialProjectSlug,
}) {
  const queryClient = useQueryClient();

  const [selectedProject, setSelectedProject] = useState(initialProjectSlug || '');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task',
    priority: 'medium',
    statusId: 'unassigned',
    assigneeId: 'unassigned',
    sprintId: 'backlog',
    dueDate: '',
  });

  // Reset form when opened with new project slug
  useEffect(() => {
    if (open) {
      setSelectedProject(initialProjectSlug || '');
      setFormData({
        title: '',
        description: '',
        type: 'task',
        priority: 'medium',
        statusId: 'unassigned',
        assigneeId: 'unassigned',
        sprintId: 'backlog',
        dueDate: '',
      });
    }
  }, [open, initialProjectSlug]);

  const { data: projectsData, isLoading: isLoadingProjects } = useProjects(orgSlug, {}, { enabled: open && !!orgSlug });
  const projects = projectsData?.projects || [];

  const { data: membersData, isLoading: isLoadingMembers } = useProjectMembers(
    orgSlug,
    selectedProject,
    { enabled: open && !!orgSlug && !!selectedProject }
  );
  const members = membersData?.members || [];

  const { data: sprintsData, isLoading: isLoadingSprints } = useSprints(
    orgSlug,
    selectedProject,
    {},
    { enabled: open && !!orgSlug && !!selectedProject }
  );
  const sprints = sprintsData?.sprints || [];

  const { data: statusesData, isLoading: isLoadingStatuses } = useIssueStatuses(
    orgSlug,
    selectedProject,
    { enabled: open && !!orgSlug && !!selectedProject }
  );
  const statuses = statusesData?.statuses || [];

  const createIssueMutation = useCreateIssue();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!selectedProject) {
      toast.error('Project is required');
      return;
    }

    const payload = {
      orgSlug,
      projectSlug: selectedProject,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      type: formData.type,
      priority: formData.priority,
      statusId: formData.statusId !== 'unassigned' ? formData.statusId : undefined,
      assigneeId: formData.assigneeId !== 'unassigned' ? formData.assigneeId : undefined,
      sprintId: formData.sprintId !== 'backlog' ? formData.sprintId : undefined,
      dueDate: formData.dueDate || undefined,
    };

    createIssueMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Issue created successfully');
        onOpenChange(false);
        queryClient.invalidateQueries({
          queryKey: queryKeys.issues.list(orgSlug, selectedProject),
          exact: false,
        });
      },
      onError: (error) => {
        toast.error(error?.response?.data?.message || 'Failed to create issue');
      },
    });
  };

  const isPending = createIssueMutation.isPending;

  // Minimal select trigger classes for the sidebar
  const triggerClasses = "h-7 border-0 bg-transparent shadow-none px-2 text-[13px] text-neutral-700 hover:bg-neutral-200/50 focus:ring-0 w-full justify-end truncate rounded-sm transition-colors";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] md:h-[600px] p-0 flex flex-col bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Main Content Area (Left) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex flex-col gap-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">New Issue</span>
              </div>

              <div className="space-y-4 flex-1">
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Issue title..."
                  required
                  className="h-12 border-0 px-0 text-2xl font-semibold text-neutral-900 focus-visible:ring-0 shadow-none placeholder:text-neutral-300"
                  autoFocus
                />

                <div className="pt-4 border-t border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Description</h3>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Add a detailed description..."
                    className="min-h-[250px] resize-none border-0 px-0 text-[14px] leading-relaxed text-neutral-700 bg-transparent focus-visible:ring-0 shadow-none placeholder:text-neutral-400"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Details Area (Right) */}
            <div className="w-full md:w-[320px] bg-neutral-50/50 border-l border-neutral-100 p-6 md:p-8 overflow-y-auto">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-6">Details</h3>
              
              <div className="flex flex-col space-y-1">
                <DetailRow icon={<Folder className="w-3.5 h-3.5" />} label="Project">
                  <Select
                    value={selectedProject}
                    onValueChange={(val) => {
                      setSelectedProject(val);
                      setFormData(prev => ({ ...prev, statusId: 'unassigned', assigneeId: 'unassigned', sprintId: 'backlog' }));
                    }}
                    disabled={isLoadingProjects}
                  >
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<Layers className="w-3.5 h-3.5" />} label="Type">
                  <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="sub_task">Sub-task</SelectItem>
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<Zap className="w-3.5 h-3.5" />} label="Priority">
                  <Select value={formData.priority} onValueChange={(val) => handleChange('priority', val)}>
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<CircleDashed className="w-3.5 h-3.5" />} label="Status">
                  <Select
                    value={formData.statusId}
                    onValueChange={(val) => handleChange('statusId', val)}
                    disabled={isLoadingStatuses || !selectedProject}
                  >
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue placeholder="Project Default" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="unassigned">Project Default</SelectItem>
                      {statuses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<User className="w-3.5 h-3.5" />} label="Assignee">
                  <Select
                    value={formData.assigneeId}
                    onValueChange={(val) => handleChange('assigneeId', val)}
                    disabled={isLoadingMembers || !selectedProject}
                  >
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members.map((m) => {
                        const u = m.user;
                        return (
                          <SelectItem key={u.id} value={u.id}>
                            {u.displayName || u.email}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<CalendarDays className="w-3.5 h-3.5" />} label="Sprint">
                  <Select
                    value={formData.sprintId}
                    onValueChange={(val) => handleChange('sprintId', val)}
                    disabled={isLoadingSprints || !selectedProject}
                  >
                    <SelectTrigger className={triggerClasses}>
                      <SelectValue placeholder="Backlog" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectItem value="backlog">Backlog</SelectItem>
                      {sprints.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.status === 'ACTIVE' ? '(Active)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DetailRow>

                <DetailRow icon={<Clock className="w-3.5 h-3.5" />} label="Due Date">
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleChange('dueDate', e.target.value)}
                    className="h-7 w-auto border-0 bg-transparent px-2 text-[13px] text-neutral-700 shadow-none focus-visible:ring-0 text-right hover:bg-neutral-200/50 cursor-pointer rounded-sm"
                  />
                </DetailRow>
              </div>
            </div>
          </div>

          {/* Bottom Footer Area */}
          <DialogFooter className="p-4 md:px-6 md:py-4 border-t border-neutral-100 flex flex-row justify-end gap-3 bg-white">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-8 px-4 rounded-md font-medium text-[13px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-8 px-6 rounded-md bg-[#5E6AD2] text-white font-medium text-[13px] hover:bg-[#4C56B5] transition-colors shadow-sm disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3 w-3 rounded-full border-[1.5px] border-white/30 border-t-white animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Create Issue'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}