import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function BoardHeader({
  projectName,
  issueCount,
  onCreateTask,
  onCreateStatus,
}) {
  return (
    <header className="flex-none px-6 py-4 border-b border-border bg-white flex items-center justify-between z-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{projectName} Board</h1>
        <p className="text-sm text-slate-500 mt-1">Manage tasks and sprint progress</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">
          {issueCount} issues
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-300"
          onClick={onCreateStatus}
        >
          <Plus className="w-4 h-4 mr-1" /> Create Status
        </Button>
        <Button
          size="sm"
          className="bg-[#0747A6] hover:bg-[#0052CC]"
          onClick={onCreateTask}
        >
          <Plus className="w-4 h-4 mr-1" /> Create Task
        </Button>
      </div>
    </header>
  );
}
