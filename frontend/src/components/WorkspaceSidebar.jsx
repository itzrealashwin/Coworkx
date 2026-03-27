import { useState, useEffect, useRef } from "react"
import { Link, useParams, useLocation, useNavigate } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  LayoutDashboard,
  Users,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { useOrganizations } from "@/hooks/useOrganizations"
import { useProjects } from "@/hooks/useProjects"

const NAV_ITEMS = (orgSlug) => [
  { key: "overview", icon: LayoutDashboard, label: "Overview", to: `/${orgSlug}` },
  { key: "members",  icon: Users,           label: "Members",  to: `/${orgSlug}/members` },
  { key: "settings", icon: Settings,        label: "Settings", to: `/${orgSlug}/settings` },
]

export default function WorkspaceSidebar() {
  const { orgSlug, projectSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const { user, logout } = useAuth()
  const { data: orgsData } = useOrganizations()
  const { data: projectsData } = useProjects(orgSlug)

  const organizations = orgsData?.organizations || []
  const projectsList = projectsData?.projects || []
  const currentOrg = organizations.find((o) => o.slug === orgSlug) || organizations[0]

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [orgMenuOpen, setOrgMenuOpen] = useState(false)
  const userMenuRef = useRef(null)
  const orgMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false)
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target))
        setOrgMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const activeItem = location.pathname.includes("/members")
    ? "members"
    : location.pathname.includes("/settings")
    ? "settings"
    : projectSlug
    ? `project-${projectSlug}`
    : "overview"

  const navItemClass = (key) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] font-medium transition-colors duration-150 cursor-pointer w-full hover:bg-[#091E420F] hover:text-[#172B4D] ${
      activeItem === key
        ? "bg-[#E9F2FF] text-[#0052CC]"
        : "text-[#42526E]"
    }`

  const projectItemClass = (slug) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-[13px] font-medium transition-colors duration-150 cursor-pointer w-full hover:bg-[#091E420F] hover:text-[#172B4D] ${
      projectSlug === slug
        ? "bg-[#E9F2FF] text-[#0052CC]"
        : "text-[#42526E]"
    }`

  const userInitials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "U"

  const projectColors = ["#0052CC", "#FF5630", "#36B37E", "#FFAB00", "#6554C0"]

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={`${
          isCollapsed ? "w-[52px]" : "w-[240px]"
        } transition-all duration-200 h-screen flex flex-col bg-[#FAFBFC] border-r border-[#DFE1E6] relative overflow-hidden flex-shrink-0`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute top-4 right-[-12px] z-10 w-6 h-6 rounded-full bg-white border border-[#DFE1E6] shadow-sm hover:bg-[#F4F5F7] hover:text-[#0052CC] text-[#42526E] flex items-center justify-center transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={12} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={12} strokeWidth={2.5} />
          )}
        </button>

        {/* Org switcher */}
        <div className="px-3 pt-4 pb-2 relative" ref={orgMenuRef}>
          {orgMenuOpen && (
            <div className="absolute top-14 left-3 z-50 bg-white rounded-[3px] border border-[#DFE1E6] shadow-[0_8px_16px_rgba(9,30,66,0.15)] w-[220px] py-1 max-h-[300px] overflow-y-auto">
              <div className="px-3 py-1.5 text-[11px] font-bold text-[#5E6C84] uppercase tracking-wider">
                Switch Organization
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setOrgMenuOpen(false)
                    navigate(`/${org.slug}`)
                  }}
                  className={`w-full text-left px-3 py-2 text-[13px] text-[#172B4D] hover:bg-[#F4F5F7] transition-colors flex items-center justify-between ${
                    org.slug === orgSlug
                      ? "bg-[#E9F2FF] text-[#0052CC] font-semibold"
                      : ""
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{org.name}</span>
                  {org.slug === orgSlug && (
                    <CheckCircle size={14} className="text-[#0052CC] flex-shrink-0" />
                  )}
                </button>
              ))}
              <div className="my-1 border-t border-[#DFE1E6]" />
              <Link
                to="/orgs/new"
                onClick={() => setOrgMenuOpen(false)}
                className="w-full text-left px-3 py-2 text-[13px] text-[#172B4D] hover:bg-[#F4F5F7] transition-colors flex items-center gap-2"
              >
                <Plus size={14} /> Create Organization
              </Link>
            </div>
          )}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setOrgMenuOpen(!orgMenuOpen)}
                  className="w-7 h-7 rounded-[4px] bg-[#0052CC] flex items-center justify-center mx-auto shadow-sm mt-1"
                >
                  <span className="text-white text-[11px] font-bold">
                    {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-[12px] font-semibold">
                {currentOrg?.name || "Workspace"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={() => setOrgMenuOpen(!orgMenuOpen)}
              className="flex items-center gap-2 w-full hover:bg-[#091E420F] rounded-[4px] p-1.5 -mx-1.5 transition-colors"
            >
              <div className="w-7 h-7 rounded-[4px] bg-[#0052CC] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-[11px] font-bold">
                  {currentOrg?.name?.charAt(0)?.toUpperCase() || "W"}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-[13px] font-bold text-[#172B4D] truncate leading-tight">
                  {currentOrg?.name || "Workspace"}
                </div>
                <div className="text-[11px] text-[#5E6C84] leading-tight mt-0.5">
                  {currentOrg?.plan || "Free Plan"}
                </div>
              </div>
              <ChevronDown size={14} className="text-[#8993A4] flex-shrink-0" />
            </button>
          )}
        </div>

        <Separator className="bg-[#DFE1E6] mx-3 w-auto my-2" />

        <ScrollArea className="flex-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {/* Workspace nav */}
          <div className="px-3 pt-2 space-y-0.5">
            {!isCollapsed && (
              <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E6C84] px-3 py-1.5 mb-1">
                Workspace
              </div>
            )}

            {NAV_ITEMS(orgSlug).map(({ key, icon: NavIcon, label, to }) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <Link to={to} className={navItemClass(key)}>
                    <NavIcon size={16} className="flex-shrink-0" />
                    {!isCollapsed && <span>{label}</span>}
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="text-[12px] font-semibold">
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            ))}
          </div>

          <Separator className="bg-[#DFE1E6] mx-3 my-4 w-auto" />

          {/* Projects */}
          <div className="px-3">
            {isCollapsed ? (
              <div className="space-y-1 py-1">
                {projectsList.map((project, i) => (
                  <Tooltip key={project.id}>
                    <TooltipTrigger asChild>
                      <Link
                        to={`/${orgSlug}/projects/${project.slug}`}
                        className={`flex items-center justify-center w-full py-2.5 rounded-[4px] transition-colors ${
                          projectSlug === project.slug
                            ? "bg-[#E9F2FF]"
                            : "hover:bg-[#091E420F]"
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: projectColors[i % projectColors.length] }}
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-[12px] font-semibold">
                      {project.name}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ) : (
              <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
                <div className="flex items-center justify-between py-1.5 mb-1">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.04em] text-[#5E6C84] hover:text-[#172B4D] transition-colors px-3">
                      {projectsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      Projects
                    </button>
                  </CollapsibleTrigger>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(`/${orgSlug}/projects`)}
                        className="w-6 h-6 rounded-[3px] flex items-center justify-center text-[#42526E] hover:bg-[#091E420F] hover:text-[#172B4D] transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-[12px] font-semibold">
                      New project
                    </TooltipContent>
                  </Tooltip>
                </div>

                <CollapsibleContent className="space-y-0.5">
                  {projectsList.map((project, i) => (
                    <Link
                      to={`/${orgSlug}/projects/${project.slug}`}
                      key={project.id}
                      className={projectItemClass(project.slug)}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: projectColors[i % projectColors.length] }}
                      />
                      <span className="flex-1 text-left truncate">{project.name}</span>
                      <Badge
                        variant="secondary"
                        className={`text-[11px] font-bold border-0 px-1.5 py-0 h-4 min-w-[20px] flex items-center justify-center rounded-full ${
                          projectSlug === project.slug
                            ? "bg-[#0052CC] text-white"
                            : "bg-[#DFE1E6] text-[#172B4D]"
                        }`}
                      >
                        {project.members?.length || 0}
                      </Badge>
                    </Link>
                  ))}
                  <Link
                    to={`/${orgSlug}/projects`}
                    className="flex items-center gap-2 px-3 py-2 mt-1 text-[13px] font-medium text-[#42526E] hover:text-[#172B4D] hover:bg-[#091E420F] rounded-[4px] w-full transition-colors"
                  >
                    <Plus size={14} />
                    New Project
                  </Link>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>

          <div className="flex-1 min-h-[40px]" />
        </ScrollArea>

        {/* User menu */}
        <div className="px-3 pb-4 pt-2 relative border-t border-[#DFE1E6]" ref={userMenuRef}>
          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 z-50 bg-white rounded-[3px] border border-[#DFE1E6] shadow-[0_8px_16px_rgba(9,30,66,0.15)] w-[200px] py-1">
              <div className="px-4 py-2 border-b border-[#DFE1E6]">
                <div className="text-[13px] font-bold text-[#172B4D] truncate">{user?.displayName}</div>
                <div className="text-[11px] text-[#5E6C84] truncate">{user?.email}</div>
              </div>
              <button className="w-full text-left px-4 py-2 text-[14px] text-[#172B4D] hover:bg-[#F4F5F7] transition-colors mt-1">
                View profile
              </button>
              <Link
                to={`/${orgSlug}/settings`}
                className="block w-full text-left px-4 py-2 text-[14px] text-[#172B4D] hover:bg-[#F4F5F7] transition-colors"
              >
                Workspace settings
              </Link>
              <div className="my-1 border-t border-[#DFE1E6]" />
              <button
                onClick={() => logout()}
                className="w-full text-left px-4 py-2 text-[14px] text-[#FF5630] hover:bg-[#F4F5F7] transition-colors"
              >
                Log out
              </button>
            </div>
          )}

          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 w-full hover:bg-[#091E420F] rounded-[4px] p-1.5 -mx-1.5 transition-colors"
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user?.displayName} />}
              <AvatarFallback className="bg-[#0052CC] text-white text-[12px] font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-[13px] font-bold text-[#172B4D] truncate leading-tight">
                    {user?.displayName || "User"}
                  </div>
                  <div className="text-[11px] text-[#5E6C84] leading-tight mt-0.5">
                    Account Settings
                  </div>
                </div>
                <MoreHorizontal size={16} className="text-[#8993A4] flex-shrink-0" />
              </>
            )}
          </button>
        </div>
      </div>
    </TooltipProvider>
  )
}