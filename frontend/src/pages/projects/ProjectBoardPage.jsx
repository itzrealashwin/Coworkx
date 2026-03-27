import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useOutletContext } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MoreHorizontal, Plus, GripVertical, CheckCircle2, Circle } from 'lucide-react';

const INITIAL_DATA = {
  tasks: {
    'task-1': { id: 'task-1', content: 'Design login page', type: 'design', assignee: 'JD' },
    'task-2': { id: 'task-2', content: 'Create ERD diagram', type: 'backend', assignee: 'AM' },
    'task-3': { id: 'task-3', content: 'Setup project repository', type: 'devops', assignee: 'SR' },
    'task-4': { id: 'task-4', content: 'Implement JWT Auth', type: 'backend', assignee: 'AM' },
    'task-5': { id: 'task-5', content: 'Write user stories for MVP', type: 'product', assignee: 'SK' },
  },
  columns: {
    'column-1': {
      id: 'column-1',
      title: 'To Do',
      taskIds: ['task-1', 'task-2', 'task-3', 'task-5'],
    },
    'column-2': {
      id: 'column-2',
      title: 'In Progress',
      taskIds: ['task-4'],
    },
    'column-3': {
      id: 'column-3',
      title: 'In Review',
      taskIds: [],
    },
    'column-4': {
      id: 'column-4',
      title: 'Done',
      taskIds: [],
    },
  },
  columnOrder: ['column-1', 'column-2', 'column-3', 'column-4'],
};

export default function ProjectBoardPage() {
  const { project } = useOutletContext();
  const [data, setData] = useState(INITIAL_DATA);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const start = data.columns[source.droppableId];
    const finish = data.columns[destination.droppableId];

    // Moving within the same list
    if (start === finish) {
      const newTaskIds = Array.from(start.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...start,
        taskIds: newTaskIds,
      };

      setData({
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      });
      return;
    }

    // Moving from one list to another
    const startTaskIds = Array.from(start.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...start,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finish.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finish,
      taskIds: finishTaskIds,
    };

    setData({
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="flex-none px-6 py-4 border-b border-border bg-white flex items-center justify-between z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{project?.name || 'Project'} Board</h1>
          <p className="text-sm text-slate-500 mt-1">Manage tasks and sprint progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Avatar className="w-8 h-8 border-2 border-white"><AvatarFallback>AM</AvatarFallback></Avatar>
            <Avatar className="w-8 h-8 border-2 border-white"><AvatarFallback>JD</AvatarFallback></Avatar>
            <Avatar className="w-8 h-8 border-2 border-white"><AvatarFallback>SR</AvatarFallback></Avatar>
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">+3</div>
          </div>
          <Button size="sm" className="bg-[#0747A6] hover:bg-[#0052CC]">
            <Plus className="w-4 h-4 mr-1" /> Create Task
          </Button>
        </div>
      </header>

      {/* Board */}
      <div className="flex-1 overflow-hidden bg-[#F4F5F7]">
        <DragDropContext onDragEnd={onDragEnd}>
          <ScrollArea className="h-full" type="auto">
            <div className="flex gap-6 p-6 min-w-max h-full">
              {data.columnOrder.map((columnId) => {
                const column = data.columns[columnId];
                const tasks = column.taskIds.map((taskId) => data.tasks[taskId]);

                return (
                  <div key={column.id} className="flex flex-col w-[300px] flex-shrink-0 bg-[#EBECF0] rounded-[10px]">
                    <div className="px-3 md:px-4 py-3 pb-2 flex items-center justify-between sticky top-0 bg-[#EBECF0] rounded-t-[10px] z-10">
                      <h3 className="font-semibold text-sm text-[#172B4D]">
                        {column.title}
                        <span className="ml-2 text-xs font-normal text-slate-500">{tasks.length}</span>
                      </h3>
                      <button className="text-slate-400 hover:text-slate-700 rounded-sm hover:bg-slate-200 p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 px-2 md:px-3 pb-3 min-h-[150px] transition-colors rounded-b-[10px] ${
                            snapshot.isDraggingOver ? 'bg-slate-200' : ''
                          }`}
                        >
                          <div className="space-y-2">
                            {tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`bg-white p-3 rounded-[8px] shadow-sm border border-slate-200 group hover:border-[#0747A6] transition-colors ${
                                      snapshot.isDragging ? 'shadow-lg ring-1 ring-[#0747A6]' : ''
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <div className="flex justify-between items-start gap-2 mb-2">
                                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {project?.slug?.substring(0,3).toUpperCase() || 'CWK'}-{task.id.split('-')[1]}
                                      </span>
                                      <button className="text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-sm text-[#172B4D] mb-3 leading-snug">
                                      {task.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-auto">
                                      <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5 bg-slate-100 text-slate-600 border-0">
                                        {task.type}
                                      </Badge>
                                      <Avatar className="w-6 h-6 rounded-full border border-slate-200">
                                        <AvatarFallback className="text-[10px] bg-[#0747A6] text-white">
                                          {task.assignee}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </DragDropContext>
      </div>
    </div>
  );
}