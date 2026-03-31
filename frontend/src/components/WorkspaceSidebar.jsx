import { useState } from "react"
import { Link, useParams, useLocation, useNavigate } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  Users,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  CheckCircle2,
  Building2,
  LogOut,
  UserCircle,
  FolderKanban,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useOrganizations } from "@/hooks/useOrganizations"
import { useProjects } from "@/hooks/useProjects"

// ─── Constants ────────────────────────────────────────────────────────────────
const PROJECT_COLORS = ["#0052CC", "#FF5630", "#36B37E", "#FFAB00", "#6554C0", "#00B8D9"]

const getNavItems = (orgSlug) => [
  { key: "overview", icon: LayoutDashboard, label: "Overview",  to: `/${orgSlug}` },
  { key: "members",  icon: Users,           label: "Members",   to: `/${orgSlug}/members` },
  { key: "settings", icon: Settings,        label: "Settings",  to: `/${orgSlug}/settings` },
]

function getActiveKey(pathname, projectSlug) {
  if (pathname.includes("/members"))  return "members"
  if (pathname.includes("/settings")) return "settings"
  if (projectSlug)                    return `project-${projectSlug}`
  return "overview"
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "W"
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8993A4] px-3 pt-3 pb-1.5 select-none">
      {children}
    </p>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, isActive, isCollapsed }) {
  const base =
    "flex items-center gap-2.5 px-3 py-[7px] rounded-[5px] text-[13px] font-semibold transition-all duration-150 w-full relative group"
  const active   = "bg-[#DEEBFF] text-[#0052CC]"
  const inactive = "text-[#42526E] hover:bg-[#091E420F] hover:text-[#172B4D]"

  const inner = (
    <Link to={to} className={`${base} ${isActive ? active : inactive}`}>
      {/* Active left accent */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0052CC]" />
      )}
      <Icon size={15} className="flex-shrink-0 ml-0.5" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  )

  if (!isCollapsed) return inner
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px] font-semibold">{label}</TooltipContent>
    </Tooltip>
  )
}

// ─── ProjectItem ──────────────────────────────────────────────────────────────
function ProjectItem({ project, index, orgSlug, isActive, isCollapsed }) {
  const color = PROJECT_COLORS[index % PROJECT_COLORS.length]
  const base  = "flex items-center gap-2.5 px-3 py-[7px] rounded-[5px] text-[13px] font-semibold transition-all duration-150 w-full relative group"
  const active   = "bg-[#DEEBFF] text-[#0052CC]"
  const inactive = "text-[#42526E] hover:bg-[#091E420F] hover:text-[#172B4D]"

  const inner = (
    <Link
      to={`/${orgSlug}/projects/${project.slug}`}
      className={`${base} ${isActive ? active : inactive}`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#0052CC]" />
      )}
      {/* Color dot */}
      <span
        className="w-[7px] h-[7px] rounded-full flex-shrink-0 ml-0.5"
        style={{ backgroundColor: color }}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{project.name}</span>
          {(project.members?.length > 0) && (
            <Badge
              className={`text-[10px] font-bold border-0 px-1.5 py-0 h-4 min-w-[18px] rounded-full ${
                isActive ? "bg-[#0052CC] text-white" : "bg-[#DFE1E6] text-[#5E6C84]"
              }`}
            >
              {project.members.length}
            </Badge>
          )}
        </>
      )}
    </Link>
  )

  if (!isCollapsed) return inner
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px] font-semibold">{project.name}</TooltipContent>
    </Tooltip>
  )
}

// ─── OrgSwitcher ──────────────────────────────────────────────────────────────
function OrgSwitcher({ currentOrg, organizations, orgSlug, isCollapsed }) {
  const navigate = useNavigate()

  const trigger = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="w-8 h-8 rounded-[6px] bg-[#0052CC] flex items-center justify-center mx-auto shadow-sm hover:bg-[#0065FF] transition-colors">
          <span className="text-white text-[12px] font-extrabold">
            {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[12px] font-semibold">
        {currentOrg?.name || "Workspace"}
      </TooltipContent>
    </Tooltip>
  ) : (
    <button className="flex items-center gap-2.5 w-full hover:bg-[#091E420F] rounded-[5px] p-1.5 -mx-1.5 transition-colors group">
      <div className="w-8 h-8 rounded-[6px] bg-[#0052CC] flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white text-[12px] font-extrabold">
          {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
        </span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-[13px] font-bold text-[#172B4D] truncate leading-tight">
          {currentOrg?.name || "Workspace"}
        </p>
        <p className="text-[10px] text-[#5E6C84] leading-tight mt-0.5 font-medium">
          {currentOrg?.plan || "Free plan"}
        </p>
      </div>
      <ChevronDown size={13} className="text-[#8993A4] flex-shrink-0 group-hover:text-[#5E6C84] transition-colors" />
    </button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>{trigger}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[220px] shadow-[0_8px_24px_rgba(9,30,66,0.16)]"
      >
        <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8993A4] px-2 py-1.5">
          Your organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => navigate(`/${org.slug}`)}
            className={`text-[13px] font-medium cursor-pointer flex items-center justify-between gap-2 ${
              org.slug === orgSlug ? "text-[#0052CC] font-semibold bg-[#DEEBFF] focus:bg-[#DEEBFF]" : ""
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-[3px] bg-[#0052CC] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-extrabold">
                  {org.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <span className="truncate">{org.name}</span>
            </div>
            {org.slug === orgSlug && <CheckCircle2 size={13} className="text-[#0052CC] flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/orgs/new"
            className="text-[13px] font-semibold text-[#42526E] flex items-center gap-2 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-[3px] border border-dashed border-[#B3BAC5] flex items-center justify-center">
              <Plus size={10} className="text-[#5E6C84]" />
            </div>
            Create organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── UserMenu ─────────────────────────────────────────────────────────────────
function UserMenu({ user, orgSlug, isCollapsed, logout }) {
  const initials = getInitials(user?.displayName)

  const avatarNode = (
    <Avatar className="w-7 h-7 flex-shrink-0 border border-[#DFE1E6]">
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.displayName} />}
      <AvatarFallback className="bg-[#0052CC] text-white text-[11px] font-extrabold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  const trigger = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="flex items-center justify-center w-full py-1 hover:bg-[#091E420F] rounded-[5px] transition-colors">
          {avatarNode}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-[12px] font-semibold">
        {user?.displayName || "Account"}
      </TooltipContent>
    </Tooltip>
  ) : (
    <button className="flex items-center gap-2.5 w-full hover:bg-[#091E420F] rounded-[5px] p-1.5 -mx-1.5 transition-colors group">
      {avatarNode}
      <div className="flex-1 text-left min-w-0">
        <p className="text-[13px] font-bold text-[#172B4D] truncate leading-tight">
          {user?.displayName || "User"}
        </p>
        <p className="text-[10px] text-[#5E6C84] leading-tight mt-0.5 truncate">
          {user?.email}
        </p>
      </div>
      <MoreHorizontal size={14} className="text-[#8993A4] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>{trigger}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[200px] shadow-[0_8px_24px_rgba(9,30,66,0.16)]"
      >
        <div className="px-2 py-2 border-b border-[#F4F5F7]">
          <p className="text-[13px] font-bold text-[#172B4D] truncate">{user?.displayName}</p>
          <p className="text-[11px] text-[#5E6C84] truncate mt-0.5">{user?.email}</p>
        </div>
        <div className="py-1">
          <DropdownMenuItem className="text-[13px] font-medium text-[#172B4D] cursor-pointer flex items-center gap-2">
            <UserCircle size={13} className="text-[#5E6C84]" /> View profile
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to={`/${orgSlug}/settings`}
              className="text-[13px] font-medium text-[#172B4D] cursor-pointer flex items-center gap-2"
            >
              <Settings size={13} className="text-[#5E6C84]" /> Settings
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-[13px] font-semibold text-[#DE350B] focus:text-[#DE350B] focus:bg-[#FFEBE6] cursor-pointer flex items-center gap-2"
        >
          <LogOut size={13} /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── ProjectsSection ──────────────────────────────────────────────────────────
function ProjectsSection({ projectsList, orgSlug, projectSlug, isCollapsed }) {
  const [open, setOpen] = useState(true)
  const navigate        = useNavigate()

  if (isCollapsed) {
    return (
      <div className="space-y-0.5">
        {projectsList.map((project, i) => (
          <ProjectItem
            key={project.id}
            project={project}
            index={i}
            orgSlug={orgSlug}
            isActive={projectSlug === project.slug}
            isCollapsed
          />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(`/${orgSlug}/projects`)}
              className="flex items-center justify-center w-full py-[7px] rounded-[5px] text-[#42526E] hover:bg-[#091E420F] hover:text-[#172B4D] transition-colors"
            >
              <Plus size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[12px] font-semibold">New project</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between pr-1">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8993A4] hover:text-[#42526E] px-3 pt-3 pb-1.5 transition-colors">
            {open
              ? <ChevronDown size={11} strokeWidth={2.5} />
              : <ChevronRight size={11} strokeWidth={2.5} />
            }
            Projects
            <span className="ml-1 text-[9px] font-bold bg-[#DFE1E6] text-[#5E6C84] px-1.5 py-0.5 rounded-full">
              {projectsList.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(`/${orgSlug}/projects`)}
              className="w-5 h-5 rounded-[3px] flex items-center justify-center text-[#8993A4] hover:bg-[#DFE1E6] hover:text-[#172B4D] transition-colors mt-1.5"
            >
              <Plus size={12} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[12px] font-semibold">New project</TooltipContent>
        </Tooltip>
      </div>

      <CollapsibleContent className="space-y-0.5 overflow-hidden data-[state=closed]:animate-none">
        {projectsList.length === 0 ? (
          <div className="px-3 py-3 mx-1 rounded-[5px] border border-dashed border-[#DFE1E6] text-center">
            <FolderKanban size={16} className="text-[#B3BAC5] mx-auto mb-1" />
            <p className="text-[11px] text-[#8993A4] font-medium">No projects yet</p>
          </div>
        ) : (
          projectsList.map((project, i) => (
            <ProjectItem
              key={project.id}
              project={project}
              index={i}
              orgSlug={orgSlug}
              isActive={projectSlug === project.slug}
              isCollapsed={false}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT: WorkspaceSidebar
// ══════════════════════════════════════════════════════════════════════════════
export default function WorkspaceSidebar() {
  const { orgSlug, projectSlug } = useParams()
  const location                 = useLocation()

  const { user, logout }         = useAuth()
  const { data: orgsData }       = useOrganizations()
  const { data: projectsData }   = useProjects(orgSlug)

  const organizations = orgsData?.organizations || []
  const projectsList  = projectsData?.projects  || []
  const currentOrg    = organizations.find((o) => o.slug === orgSlug) || organizations[0]

  const [isCollapsed, setIsCollapsed] = useState(false)

  const activeKey = getActiveKey(location.pathname, projectSlug)
  const navItems  = getNavItems(orgSlug)

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={`${
          isCollapsed ? "w-[52px]" : "w-[240px]"
        } transition-[width] duration-200 ease-in-out h-screen flex flex-col bg-[#FAFBFC] border-r border-[#DFE1E6] relative flex-shrink-0`}
      >

        {/* ── Collapse toggle ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-[18px] right-[-11px] z-20 w-[22px] h-[22px] rounded-full bg-white border border-[#DFE1E6] shadow-[0_1px_4px_rgba(9,30,66,0.12)] hover:bg-[#F4F5F7] hover:border-[#B3BAC5] text-[#5E6C84] hover:text-[#172B4D] flex items-center justify-center transition-all"
            >
              {isCollapsed
                ? <PanelLeftOpen  size={11} strokeWidth={2.5} />
                : <PanelLeftClose size={11} strokeWidth={2.5} />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-[12px] font-semibold">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* ── Org switcher ── */}
        <div className={`${isCollapsed ? "px-2 py-3 flex justify-center" : "px-3 pt-4 pb-3"}`}>
          <OrgSwitcher
            currentOrg={currentOrg}
            organizations={organizations}
            orgSlug={orgSlug}
            isCollapsed={isCollapsed}
          />
        </div>

        <Separator className="bg-[#DFE1E6] mx-3 w-auto" />

        {/* ── Scrollable body ── */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-2 pb-4">

            {/* Workspace nav */}
            {!isCollapsed && <SectionLabel>Workspace</SectionLabel>}
            {isCollapsed  && <div className="h-3" />}

            <div className="space-y-0.5">
              {navItems.map(({ key, icon, label, to }) => (
                <NavItem
                  key={key}
                  to={to}
                  icon={icon}
                  label={label}
                  isActive={activeKey === key}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>

            {/* Projects */}
            <div className={`${isCollapsed ? "mt-3" : "mt-1"}`}>
              {isCollapsed && <Separator className="bg-[#DFE1E6] mb-2 mx-1" />}
              <ProjectsSection
                projectsList={projectsList}
                orgSlug={orgSlug}
                projectSlug={projectSlug}
                isCollapsed={isCollapsed}
              />
            </div>

          </div>
        </ScrollArea>

        {/* ── User menu ── */}
        <div className={`border-t border-[#DFE1E6] ${isCollapsed ? "px-2 py-3 flex justify-center" : "px-3 py-3"}`}>
          <UserMenu
            user={user}
            orgSlug={orgSlug}
            isCollapsed={isCollapsed}
            logout={logout}
          />
        </div>

      </div>
    </TooltipProvider>
  )
}