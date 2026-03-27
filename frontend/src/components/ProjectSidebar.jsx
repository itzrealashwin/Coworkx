import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboard,
  Inbox,
  List,
  Kanban,
  Users,
  BarChart2,
  Clock,
  ChevronLeft
} from "lucide-react"

const sprintData = {
  name: "Current Sprint",
  status: "Active",
  tasksCompleted: 8,
  tasksTotal: 20,
  daysLeft: 5,
  progress: 65,
}

export default function ProjectSidebar({ project, orgSlug }) {
  const [activeItem, setActiveItem] = useState("sprint")
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    setTimeout(() => setProgressWidth(sprintData.progress), 100)
  }, [])

  const navItemClass = (key) =>
    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 cursor-pointer w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
      activeItem === key
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
        : "font-medium"
    }`

  const navItems = [
    { key: "overview",  icon: LayoutDashboard, label: "Overview"      },
    { key: "inbox",     icon: Inbox,           label: "Issues Inbox", badge: "10" },
    { key: "backlog",   icon: List,            label: "Backlog",      badge: "23" },
    { key: "sprint",    icon: Kanban,          label: "Sprint Board"  },
    { key: "workload",  icon: Users,           label: "Workload"      },
    { key: "analytics", icon: BarChart2,       label: "Analytics"     },
    { key: "activity",  icon: Clock,           label: "Activity"      },
  ]

  return (
    <div className="w-64 h-screen flex flex-col bg-sidebar border-r border-sidebar-border flex-shrink-0">
      
      {/* Back Link */}
      <div className="px-4 pt-5 pb-2">
        <Link
          to={`/${orgSlug}`}
          className="flex items-center gap-1.5 w-full text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          Back to Projects
        </Link>
      </div>

      {/* Project Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0 bg-primary shadow-sm">
            <span className="text-primary-foreground text-sm font-bold">
              {project?.name?.charAt(0)?.toUpperCase() || "P"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-sidebar-foreground truncate leading-tight">
              {project?.name || "Software Project"}
            </div>
            <div className="text-xs text-sidebar-foreground/60 leading-tight mt-0.5">
              Classic Project
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border mx-4 w-auto my-1" />

      {/* Navigation Links */}
      <ScrollArea className="flex-1">
        <div className="px-3 pt-4 space-y-0.5">
          <div className="text-xs font-bold uppercase tracking-wider text-sidebar-foreground/50 px-3 pb-2">
            Project
          </div>

          {navItems.map(({ key, icon: Icon, label, badge }) => (
            <TooltipProvider key={key} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={navItemClass(key)}
                    onClick={() => setActiveItem(key)}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{label}</span>
                    {badge && (
                      <Badge
                        variant="secondary"
                        className="bg-sidebar-border/50 text-sidebar-foreground text-[10px] font-bold border-0 px-2 py-0.5 h-5 flex items-center justify-center"
                      >
                        {badge}
                      </Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-popover text-popover-foreground text-xs font-semibold px-2.5 py-1.5 rounded-md border border-border shadow-sm"
                >
                  {label}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <Separator className="bg-sidebar-border mx-4 my-4 w-auto" />

        {/* Sprint Widget */}
        <div className="px-4 pb-4">
          <div className="bg-sidebar-accent/50 rounded-lg p-3 border border-sidebar-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-sidebar-foreground">
                {sprintData.name}
              </span>
              <Badge
                variant="secondary"
                className="bg-chart-2/15 text-chart-2 hover:bg-chart-2/25 text-[10px] uppercase font-bold border-0 px-1.5 py-0"
              >
                {sprintData.status}
              </Badge>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-2 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
              <div
                className="h-full bg-chart-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-[11px] font-medium text-sidebar-foreground/60">
                {sprintData.tasksCompleted} / {sprintData.tasksTotal} tasks
              </span>
              <span className="text-[11px] font-medium text-sidebar-foreground/60">
                {sprintData.daysLeft} days left
              </span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}