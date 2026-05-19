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
  if (!name) return "W";
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "W";
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold px-3 pt-4 pb-2 text-muted-foreground select-none">
      {children}
    </p>
  )
}

// ─── NavItem ──────────────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, isActive, isCollapsed }) {
  const base =
    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 w-full relative group"
  const active   = "bg-accent text-accent-foreground shadow-sm"
  const inactive = "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

  const inner = (
    <Link to={to} className={`${base} ${isActive ? active : inactive}`}>
      <Icon size={16} className={`flex-shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
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
  const base  = "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 w-full relative group"
  const active   = "bg-accent text-accent-foreground shadow-sm"
  const inactive = "text-muted-foreground hover:bg-muted/50 hover:text-foreground"

  const inner = (
    <Link
      to={`/${orgSlug}/projects/${project.slug}`}
      className={`${base} ${isActive ? active : inactive}`}
    >
      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {!isCollapsed && (
        <>
          <span className="flex-1 truncate">{project.name}</span>
          {(project.members?.length > 0) && (
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 h-4 min-w-[18px] bg-muted text-muted-foreground ${isActive && "bg-background shadow-sm"}`}
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
        <button className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mx-auto shadow-sm hover:bg-primary/90 transition-colors">
          <span className="text-primary-foreground text-xs font-bold">
            {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">
        {currentOrg?.name || "Workspace"}
      </TooltipContent>
    </Tooltip>
  ) : (
    <button className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg p-2 transition-colors group border border-transparent hover:border-border/50">
      <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-primary-foreground text-xs font-bold">
          {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
        </span>
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {currentOrg?.name || "Workspace"}
        </p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5 font-medium">
          {currentOrg?.plan || "Free plan"}
        </p>
      </div>
      <ChevronDown size={14} className="text-muted-foreground flex-shrink-0 group-hover:text-foreground transition-colors" />
    </button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="outline-none">{trigger}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        sideOffset={6}
        className="w-[240px] rounded-xl shadow-md border-border/40"
      >
        <DropdownMenuLabel className="text-xs font-semibold px-3 py-2 text-muted-foreground">
          Your organizations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => navigate(`/${org.slug}`)}
            className={`text-sm cursor-pointer flex items-center justify-between gap-2 rounded-md ${
              org.slug === orgSlug ? "text-foreground font-medium bg-accent" : "text-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
                <span className="text-primary text-[10px] font-bold">
                  {org.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <span className="truncate">{org.name}</span>
            </div>
            {org.slug === orgSlug && <CheckCircle2 size={14} className="text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            to="/orgs/new"
            className="text-sm font-medium text-foreground flex items-center gap-2 cursor-pointer rounded-md mx-1 py-2"
          >
            <div className="w-6 h-6 rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Plus size={12} className="text-muted-foreground" />
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
    <Avatar className="w-8 h-8 flex-shrink-0 border border-border shadow-sm">
      {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.displayName} />}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  )

  const trigger = isCollapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="flex items-center justify-center w-full py-2 hover:bg-muted/50 rounded-lg transition-colors">
          {avatarNode}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs font-medium">
        {user?.displayName || "Account"}
      </TooltipContent>
    </Tooltip>
  ) : (
    <button className="flex items-center gap-3 w-full hover:bg-muted/50 rounded-lg p-2 -mx-2 transition-colors group">
      {avatarNode}
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">
          {user?.displayName || "User"}
        </p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
          {user?.email}
        </p>
      </div>
      <MoreHorizontal size={14} className="text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="outline-none">{trigger}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-[220px] rounded-xl shadow-md border-border/40"
      >
        <div className="px-3 py-2 border-b border-border/40">
          <p className="text-sm font-semibold text-foreground truncate">{user?.displayName}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
        </div>
        <div className="py-1.5">
          <DropdownMenuItem className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2 rounded-md mx-1">
            <UserCircle size={14} className="text-muted-foreground" /> View profile
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="rounded-md mx-1">
            <Link
              to={`/${orgSlug}/settings`}
              className="text-sm font-medium text-foreground cursor-pointer flex items-center gap-2"
            >
              <Settings size={14} className="text-muted-foreground" /> Settings
            </Link>
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="text-sm font-medium text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2 rounded-md mx-1 mb-1"
        >
          <LogOut size={14} /> Log out
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
              className="flex items-center justify-center w-full py-2 rounded-md text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
            >
              <Plus size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-semibold">New project</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between pr-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 pt-4 pb-2 transition-colors select-none outline-none">
            {open
              ? <ChevronDown size={14} className="text-muted-foreground" />
              : <ChevronRight size={14} className="text-muted-foreground" />
            }
            Projects
            <span className="ml-1 text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full relative -top-px">
              {projectsList.length}
            </span>
          </button>
        </CollapsibleTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate(`/${orgSlug}/projects`)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground outline-none transition-colors mt-2"
            >
              <Plus size={14} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">New project</TooltipContent>
        </Tooltip>
      </div>

      <CollapsibleContent className="space-y-0.5 overflow-hidden data-[state=closed]:animate-none mx-2">
        {projectsList.length === 0 ? (
          <div className="px-3 py-4 mx-2 rounded-md border border-dashed border-border text-center">
            <FolderKanban size={18} className="text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-medium">No projects yet</p>
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
          isCollapsed ? "w-[72px]" : "w-[260px]"
        } transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] h-screen flex flex-col bg-background border-r border-border relative flex-shrink-0 shadow-[1px_0_12px_rgba(0,0,0,0.02)]`}
      >

        {/* ── Collapse toggle ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="absolute top-[22px] right-[-13px] z-20 w-[26px] h-[26px] rounded-full bg-background border border-border shadow-sm hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all focus:outline-none"
            >
              {isCollapsed
                ? <PanelLeftOpen  size={14} />
                : <PanelLeftClose size={14} />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-semibold">
            {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* ── Org switcher ── */}
        <div className={`${isCollapsed ? "px-2 py-4 flex justify-center" : "px-4 pt-5 pb-3"}`}>
          <OrgSwitcher
            currentOrg={currentOrg}
            organizations={organizations}
            orgSlug={orgSlug}
            isCollapsed={isCollapsed}
          />
        </div>

        <Separator className="bg-border/60 mx-4 w-auto" />

        {/* ── Scrollable body ── */}
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="px-2 pb-6 pt-2">

            {/* Workspace nav */}
            {!isCollapsed && <SectionLabel>Workspace</SectionLabel>}
            {isCollapsed  && <div className="h-4" />}

            <div className="space-y-1 mx-2">
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
            <div className={`${isCollapsed ? "mt-4" : "mt-2"}`}>
              {isCollapsed && <Separator className="bg-border/60 mb-3 mx-2" />}
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
        <div className={`border-t border-border w-full ${isCollapsed ? "px-2 py-3 flex justify-center" : "p-3 pt-3"}`}>
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