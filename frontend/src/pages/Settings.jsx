import { useState, useRef } from "react";
import {
  User, Palette, Github, Bell, Shield, Trash2,
  ChevronRight, Check, Moon, Sun, Monitor, Upload,
  Link2, Link2Off, LogOut, Key, Smartphone, Eye,
  EyeOff, AlertTriangle, ExternalLink, Zap, Globe,
  Clock, Mail, MessageSquare, AtSign, Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// ─── Nav config ────────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "profile",       label: "Profile",        icon: User,    description: "Your personal info" },
  { id: "appearance",    label: "Appearance",      icon: Palette, description: "Theme & display" },
  { id: "integrations",  label: "Integrations",    icon: Zap,     description: "Connect tools" },
  { id: "notifications", label: "Notifications",   icon: Bell,    description: "Alert preferences" },
  { id: "security",      label: "Security",        icon: Shield,  description: "Password & sessions" },
  { id: "danger",        label: "Danger Zone",     icon: Trash2,  description: "Destructive actions" },
];

// ─── Accent colors ─────────────────────────────────────────────────────────────
const ACCENTS = [
  { id: "blue",   label: "Ocean",    color: "#0052CC", hover: "#0065FF" },
  { id: "violet", label: "Violet",   color: "#6554C0", hover: "#8777D9" },
  { id: "teal",   label: "Teal",     color: "#00B8D9", hover: "#00C7E6" },
  { id: "green",  label: "Emerald",  color: "#36B37E", hover: "#57D9A3" },
  { id: "red",    label: "Crimson",  color: "#FF5630", hover: "#FF7452" },
  { id: "orange", label: "Amber",    color: "#FF8B00", hover: "#FFA000" },
];

// ─── Density options ───────────────────────────────────────────────────────────
const DENSITY_OPTIONS = [
  { id: "compact",     label: "Compact",     desc: "Tighter spacing, more content visible" },
  { id: "comfortable", label: "Comfortable", desc: "Balanced — recommended" },
  { id: "spacious",    label: "Spacious",    desc: "More breathing room between elements" },
];

// ─── Reusable section wrapper ──────────────────────────────────────────────────
function SettingsSection({ title, description, children }) {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#DFE1E6] pb-4">
        <h2 className="text-[18px] font-extrabold tracking-tight text-[#172B4D]">{title}</h2>
        {description && (
          <p className="text-[13px] text-[#5E6C84] mt-1 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// ─── Settings row ──────────────────────────────────────────────────────────────
function SettingsRow({ label, description, children, htmlFor }) {
  return (
    <div className="flex items-start justify-between gap-8">
      <div className="flex-1 min-w-0">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className="text-[13px] font-semibold text-[#172B4D] cursor-pointer">
            {label}
          </Label>
        ) : (
          <p className="text-[13px] font-semibold text-[#172B4D]">{label}</p>
        )}
        {description && (
          <p className="text-[12px] text-[#5E6C84] mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-[8px] border border-[#DFE1E6] p-5 shadow-[0_1px_3px_rgba(9,30,66,0.07)] ${className}`}>
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Profile
// ══════════════════════════════════════════════════════════════════════════════
function ProfileSection({ user }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "Ashwin M.");
  const [username,    setUsername]    = useState(user?.username    || "ashwinm");
  const [bio,         setBio]         = useState("");
  const [timezone,    setTimezone]    = useState("Asia/Kolkata");
  const fileRef = useRef(null);

  const handleSave = () => toast.success("Profile updated successfully");

  return (
    <SettingsSection
      title="Profile"
      description="This information is visible to your teammates across all workspaces. Your username is used in @mentions."
    >
      {/* Avatar */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar className="h-16 w-16 border-2 border-[#DFE1E6]">
              <AvatarImage src={user?.avatarUrl || `https://avatar.vercel.sh/${user?.email}`} />
              <AvatarFallback className="bg-[#DEEBFF] text-[#0052CC] text-[20px] font-extrabold">
                {(displayName || "A").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={14} className="text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={() => toast.info("Avatar upload coming soon")} />
          <div>
            <p className="text-[14px] font-bold text-[#172B4D]">Profile photo</p>
            <p className="text-[12px] text-[#5E6C84] mt-0.5">
              JPG, PNG or GIF. Max size 2 MB. Recommended: 256×256px.
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px] font-semibold"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={12} className="mr-1.5" /> Upload photo
              </Button>
              <Button size="sm" variant="ghost" className="h-7 text-[12px] text-[#DE350B] hover:text-[#DE350B] hover:bg-[#FFEBE6]">
                Remove
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Name + Username */}
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="display-name" className="text-[13px] font-semibold text-[#172B4D]">
              Display Name
            </Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="text-[13px]"
            />
            <p className="text-[11px] text-[#8993A4]">Shown on cards, comments and mentions.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-[13px] font-semibold text-[#172B4D]">
              Username
            </Label>
            <div className="relative">
              <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8993A4]" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_-]/g, ""))}
                className="pl-8 text-[13px]"
              />
            </div>
            <p className="text-[11px] text-[#8993A4]">coworkx.app/@{username}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio" className="text-[13px] font-semibold text-[#172B4D]">
            Bio <span className="text-[#8993A4] font-normal">(optional)</span>
          </Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell your team a bit about yourself…"
            rows={3}
            className="text-[13px] resize-none"
            maxLength={160}
          />
          <p className="text-[11px] text-[#8993A4] text-right">{bio.length}/160</p>
        </div>
      </Card>

      {/* Timezone */}
      <Card>
        <SettingsRow
          label="Timezone"
          description="Used for scheduling reminders and displaying timestamps in your local time."
        >
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[#5E6C84]" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-[220px] text-[13px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Kolkata"  className="text-[13px]">IST — Asia/Kolkata (UTC+5:30)</SelectItem>
                <SelectItem value="UTC"           className="text-[13px]">UTC — Coordinated Universal Time</SelectItem>
                <SelectItem value="America/New_York" className="text-[13px]">EST — America/New York (UTC-5)</SelectItem>
                <SelectItem value="Europe/London" className="text-[13px]">GMT — Europe/London (UTC+0)</SelectItem>
                <SelectItem value="Asia/Tokyo"    className="text-[13px]">JST — Asia/Tokyo (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </SettingsRow>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-[#0052CC] hover:bg-[#0065FF] text-white text-[13px] font-semibold h-9">
          Save changes
        </Button>
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Appearance
// ══════════════════════════════════════════════════════════════════════════════
function AppearanceSection() {
  const [theme,   setTheme]   = useState("light");
  const [accent,  setAccent]  = useState("blue");
  const [density, setDensity] = useState("comfortable");
  const [font,    setFont]    = useState("system");

  const themes = [
    { id: "light",  label: "Light",  icon: Sun,     preview: "bg-[#F4F5F7] border-[#DFE1E6]" },
    { id: "dark",   label: "Dark",   icon: Moon,    preview: "bg-[#1B2638] border-[#2D3F55]" },
    { id: "system", label: "System", icon: Monitor, preview: "bg-gradient-to-br from-[#F4F5F7] to-[#1B2638] border-[#DFE1E6]" },
  ];

  return (
    <SettingsSection
      title="Appearance"
      description="Customize how CoworkX looks and feels for you. These settings are stored locally and only affect your session."
    >
      {/* Theme */}
      <Card className="space-y-4">
        <div>
          <p className="text-[13px] font-bold text-[#172B4D]">Interface theme</p>
          <p className="text-[12px] text-[#5E6C84] mt-0.5">Choose between light, dark, or follow your OS preference.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(({ id, label, icon: Icon, preview }) => (
            <button
              key={id}
              onClick={() => { setTheme(id); toast.success(`${label} theme applied`); }}
              className={`relative rounded-[8px] border-2 p-3 text-left transition-all ${
                theme === id
                  ? "border-[#0052CC] shadow-[0_0_0_3px_rgba(0,82,204,0.12)]"
                  : "border-[#DFE1E6] hover:border-[#B3BAC5]"
              }`}
            >
              {/* Mini preview */}
              <div className={`h-12 rounded-[4px] mb-2.5 border ${preview}`} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className="text-[#5E6C84]" />
                  <span className="text-[12px] font-semibold text-[#172B4D]">{label}</span>
                </div>
                {theme === id && (
                  <div className="w-4 h-4 rounded-full bg-[#0052CC] flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Accent color */}
      <Card className="space-y-4">
        <div>
          <p className="text-[13px] font-bold text-[#172B4D]">Accent color</p>
          <p className="text-[12px] text-[#5E6C84] mt-0.5">Used for buttons, links, and interactive highlights throughout the app.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {ACCENTS.map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => { setAccent(id); toast.success(`${label} accent selected`); }}
              title={label}
              className={`group relative w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                accent === id ? "ring-2 ring-offset-2 scale-110" : ""
              }`}
              style={{
                backgroundColor: color,
                ...(accent === id ? { ringColor: color } : {}),
              }}
            >
              {accent === id && (
                <Check size={13} className="text-white absolute inset-0 m-auto" strokeWidth={3} />
              )}
            </button>
          ))}
          <span className="text-[12px] font-medium text-[#5E6C84] ml-1">
            {ACCENTS.find((a) => a.id === accent)?.label}
          </span>
        </div>
      </Card>

      {/* Density */}
      <Card className="space-y-4">
        <div>
          <p className="text-[13px] font-bold text-[#172B4D]">Layout density</p>
          <p className="text-[12px] text-[#5E6C84] mt-0.5">Controls padding and spacing across lists, tables, and boards.</p>
        </div>
        <div className="space-y-2">
          {DENSITY_OPTIONS.map(({ id, label, desc }) => (
            <button
              key={id}
              onClick={() => setDensity(id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-[6px] border text-left transition-all ${
                density === id
                  ? "border-[#0052CC] bg-[#DEEBFF]"
                  : "border-[#DFE1E6] hover:bg-[#FAFBFC]"
              }`}
            >
              <div>
                <p className={`text-[13px] font-semibold ${density === id ? "text-[#0052CC]" : "text-[#172B4D]"}`}>{label}</p>
                <p className="text-[11px] text-[#5E6C84] mt-0.5">{desc}</p>
              </div>
              {density === id && (
                <div className="w-5 h-5 rounded-full bg-[#0052CC] flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Font */}
      <Card>
        <SettingsRow label="Interface font" description="Affects all UI text. Code blocks always use a monospace font.">
          <Select value={font} onValueChange={setFont}>
            <SelectTrigger className="w-[180px] text-[13px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system"  className="text-[13px]">System default</SelectItem>
              <SelectItem value="inter"   className="text-[13px]">Inter</SelectItem>
              <SelectItem value="geist"   className="text-[13px]">Geist</SelectItem>
              <SelectItem value="ibm"     className="text-[13px]">IBM Plex Sans</SelectItem>
              <SelectItem value="jetbrains" className="text-[13px]">JetBrains Mono</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </Card>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Integrations
// ══════════════════════════════════════════════════════════════════════════════
function IntegrationsSection() {
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername,  setGithubUsername]  = useState("");
  const [slackConnected,  setSlackConnected]  = useState(false);
  const [figmaConnected,  setFigmaConnected]  = useState(false);

  const connectGithub = () => {
    // In real app: window.location.href = `/api/auth/github?redirect=/settings`
    toast.promise(new Promise((res) => setTimeout(res, 1200)), {
      loading: "Redirecting to GitHub…",
      success: () => {
        setGithubConnected(true);
        setGithubUsername("ashwinm-dev");
        return "GitHub connected!";
      },
      error: "Failed to connect",
    });
  };

  const disconnectGithub = () => {
    setGithubConnected(false);
    setGithubUsername("");
    toast.success("GitHub disconnected");
  };

  const integrations = [
    {
      id: "github",
      name: "GitHub",
      tagline: "Link commits, PRs, and branches to issues",
      description: "When connected, you can reference CoworkX issues from GitHub commits and pull requests. Automatically move issues to In Progress when a branch is created, and close them when a PR is merged.",
      icon: Github,
      iconBg: "#24292E",
      connected: githubConnected,
      connectedLabel: githubUsername ? `@${githubUsername}` : "Connected",
      onConnect: connectGithub,
      onDisconnect: disconnectGithub,
      badge: "Popular",
    },
    {
      id: "slack",
      name: "Slack",
      tagline: "Get issue updates and @mentions in Slack",
      description: "Receive real-time notifications about issue assignments, status changes, and comments directly in your Slack workspace. Use /coworkx commands to create issues without leaving Slack.",
      icon: MessageSquare,
      iconBg: "#4A154B",
      connected: slackConnected,
      connectedLabel: "workspace connected",
      onConnect: () => toast.info("Slack integration coming soon"),
      onDisconnect: () => { setSlackConnected(false); toast.success("Slack disconnected"); },
      badge: "Coming soon",
    },
    {
      id: "figma",
      name: "Figma",
      tagline: "Embed designs and wireframes into issues",
      description: "Paste any Figma link into an issue description or comment to get a live embed. Designers and developers stay in sync without switching between tools.",
      icon: Globe,
      iconBg: "#F24E1E",
      connected: figmaConnected,
      connectedLabel: "Connected",
      onConnect: () => toast.info("Figma integration coming soon"),
      onDisconnect: () => { setFigmaConnected(false); toast.success("Figma disconnected"); },
      badge: "Coming soon",
    },
  ];

  return (
    <SettingsSection
      title="Integrations"
      description="Connect CoworkX to the tools your team already uses. All integrations are per-user — they won't affect other members of your organization."
    >
      <div className="space-y-4">
        {integrations.map(({ id, name, tagline, description, icon: Icon, iconBg, connected, connectedLabel, onConnect, onDisconnect, badge }) => (
          <Card key={id} className="space-y-0">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: iconBg }}
              >
                <Icon size={18} className="text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-bold text-[#172B4D]">{name}</p>
                  {badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] ${
                      badge === "Popular" ? "bg-[#E3FCEF] text-[#006644]" : "bg-[#F4F5F7] text-[#5E6C84]"
                    }`}>
                      {badge}
                    </span>
                  )}
                  {connected && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#E3FCEF] text-[#006644] flex items-center gap-1">
                      <Check size={8} strokeWidth={3} /> {connectedLabel}
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-semibold text-[#42526E]">{tagline}</p>
                <p className="text-[12px] text-[#5E6C84] mt-1.5 leading-relaxed">{description}</p>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {connected ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDisconnect}
                    className="h-8 text-[12px] font-semibold text-[#DE350B] border-[#FFBDAD] hover:bg-[#FFEBE6] hover:border-[#FF5630]"
                  >
                    <Link2Off size={12} className="mr-1.5" /> Disconnect
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onConnect}
                    className="h-8 text-[12px] font-semibold bg-[#172B4D] hover:bg-[#253858] text-white"
                  >
                    <Link2 size={12} className="mr-1.5" /> Connect
                  </Button>
                )}
              </div>
            </div>

            {/* GitHub expanded state */}
            {id === "github" && connected && (
              <>
                <Separator className="my-4" />
                <div className="bg-[#F4F5F7] rounded-[6px] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#24292E] flex items-center justify-center">
                      <Github size={13} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-[#172B4D]">@{githubUsername}</p>
                      <p className="text-[11px] text-[#5E6C84]">Personal account — 3 repos linked</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-[12px] text-[#0052CC] hover:bg-[#DEEBFF]"
                    onClick={() => toast.info("Manage GitHub repos")}
                  >
                    Manage repos <ExternalLink size={11} className="ml-1" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Notifications
// ══════════════════════════════════════════════════════════════════════════════
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    email_assignments:  true,
    email_mentions:     true,
    email_comments:     false,
    email_digest:       true,
    inapp_assignments:  true,
    inapp_mentions:     true,
    inapp_comments:     true,
    inapp_sprint:       true,
    push_mentions:      false,
    push_deadlines:     false,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const groups = [
    {
      label: "Email notifications",
      description: "Sent to the email address on your account. Digest emails consolidate multiple updates into one.",
      icon: Mail,
      items: [
        { key: "email_assignments", label: "Issue assigned to you",     desc: "When someone assigns you to an issue" },
        { key: "email_mentions",    label: "@Mentions",                  desc: "When someone @mentions you in a comment" },
        { key: "email_comments",    label: "New comments on your issues", desc: "Any comment on issues you created or are assigned to" },
        { key: "email_digest",      label: "Daily digest",               desc: "A daily summary of activity across your projects" },
      ],
    },
    {
      label: "In-app notifications",
      description: "Show up in the notification bell inside CoworkX. These are always available in your notification inbox.",
      icon: Bell,
      items: [
        { key: "inapp_assignments", label: "Issue assignments",    desc: "Assigned or unassigned from an issue" },
        { key: "inapp_mentions",    label: "@Mentions",            desc: "Mentioned in comments or descriptions" },
        { key: "inapp_comments",    label: "Comments",             desc: "New comments on issues you're watching" },
        { key: "inapp_sprint",      label: "Sprint events",        desc: "Sprint started, ended, or issues moved" },
      ],
    },
    {
      label: "Push notifications",
      description: "Delivered to your browser or mobile device. Requires notification permission in your browser.",
      icon: Smartphone,
      items: [
        { key: "push_mentions",   label: "@Mentions",   desc: "High-priority: never miss a direct mention" },
        { key: "push_deadlines",  label: "Due dates",   desc: "Reminded 24 hours before an issue is due" },
      ],
    },
  ];

  return (
    <SettingsSection
      title="Notifications"
      description="Control when and how CoworkX contacts you. You can always snooze notifications from the bell icon in the sidebar."
    >
      <div className="space-y-5">
        {groups.map(({ label, description, icon: Icon, items }) => (
          <Card key={label} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[6px] bg-[#DEEBFF] flex items-center justify-center">
                <Icon size={13} className="text-[#0052CC]" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[#172B4D]">{label}</p>
                <p className="text-[11px] text-[#5E6C84]">{description}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-3">
              {items.map(({ key, label: itemLabel, desc }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-[#172B4D]">{itemLabel}</p>
                    <p className="text-[11px] text-[#8993A4]">{desc}</p>
                  </div>
                  <Switch
                    checked={prefs[key]}
                    onCheckedChange={() => toggle(key)}
                    className="data-[state=checked]:bg-[#0052CC]"
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Security
// ══════════════════════════════════════════════════════════════════════════════
function SecuritySection() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");

  const sessions = [
    { id: "s1", device: "Chrome on macOS",  location: "Pune, India",    time: "Active now",    current: true  },
    { id: "s2", device: "Safari on iPhone", location: "Pune, India",    time: "2 hours ago",   current: false },
    { id: "s3", device: "Firefox on Windows", location: "Mumbai, India", time: "3 days ago",  current: false },
  ];

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    if (newPw.length < 8)    { toast.error("Password must be at least 8 characters"); return; }
    toast.success("Password updated successfully");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  return (
    <SettingsSection
      title="Security"
      description="Manage your password and active sessions. We recommend using a unique password that you don't use anywhere else."
    >
      {/* Change password */}
      <Card className="space-y-4">
        <div>
          <p className="text-[13px] font-bold text-[#172B4D] flex items-center gap-2">
            <Key size={13} className="text-[#5E6C84]" /> Change password
          </p>
          <p className="text-[12px] text-[#5E6C84] mt-0.5">
            After changing, you'll be signed out of all other active sessions for security.
          </p>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="current-pw" className="text-[12px] font-semibold text-[#172B4D]">Current password</Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="pr-9 text-[13px]"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8993A4] hover:text-[#5E6C84]"
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-pw" className="text-[12px] font-semibold text-[#172B4D]">New password</Label>
              <div className="relative">
                <Input
                  id="new-pw"
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="pr-9 text-[13px]"
                  placeholder="Min. 8 characters"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8993A4] hover:text-[#5E6C84]">
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw" className="text-[12px] font-semibold text-[#172B4D]">Confirm password</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="text-[13px]"
                placeholder="Repeat new password"
              />
            </div>
          </div>
          {newPw.length > 0 && (
            <div className="flex gap-1.5 items-center">
              {[8, 12, 16].map((len) => (
                <div
                  key={len}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    newPw.length >= len ? "bg-[#36B37E]" : "bg-[#DFE1E6]"
                  }`}
                />
              ))}
              <span className="text-[11px] text-[#5E6C84] ml-1">
                {newPw.length < 8 ? "Weak" : newPw.length < 12 ? "Fair" : "Strong"}
              </span>
            </div>
          )}
          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!currentPw || !newPw || !confirmPw}
              className="bg-[#0052CC] hover:bg-[#0065FF] text-white text-[13px] font-semibold h-8"
            >
              Update password
            </Button>
          </div>
        </form>
      </Card>

      {/* Active sessions */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-[#172B4D] flex items-center gap-2">
              <Smartphone size={13} className="text-[#5E6C84]" /> Active sessions
            </p>
            <p className="text-[12px] text-[#5E6C84] mt-0.5">
              These are the devices currently signed into your account. Revoke any session you don't recognize.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-[12px] font-semibold text-[#DE350B] border-[#FFBDAD] hover:bg-[#FFEBE6]"
            onClick={() => toast.success("All other sessions revoked")}
          >
            Revoke all others
          </Button>
        </div>
        <div className="space-y-2">
          {sessions.map(({ id, device, location, time, current }) => (
            <div
              key={id}
              className={`flex items-center justify-between p-3 rounded-[6px] ${
                current ? "bg-[#E3FCEF] border border-[#ABF5D1]" : "bg-[#FAFBFC] border border-[#DFE1E6]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${current ? "bg-[#36B37E]" : "bg-[#8993A4]"}`} />
                <div>
                  <p className="text-[13px] font-semibold text-[#172B4D]">
                    {device}
                    {current && <span className="text-[10px] font-bold ml-2 text-[#006644]">This device</span>}
                  </p>
                  <p className="text-[11px] text-[#5E6C84]">{location} · {time}</p>
                </div>
              </div>
              {!current && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[12px] text-[#DE350B] hover:bg-[#FFEBE6]"
                  onClick={() => toast.success(`Session revoked`)}
                >
                  <LogOut size={12} className="mr-1" /> Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: Danger Zone
// ══════════════════════════════════════════════════════════════════════════════
function DangerSection() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText]           = useState("");

  return (
    <SettingsSection
      title="Danger Zone"
      description="These actions are permanent and cannot be undone. Please proceed with caution."
    >
      <div className="rounded-[8px] border border-[#FF5630] overflow-hidden">
        {/* Export data */}
        <div className="flex items-start justify-between gap-4 p-5 bg-white">
          <div>
            <p className="text-[13px] font-bold text-[#172B4D]">Export your data</p>
            <p className="text-[12px] text-[#5E6C84] mt-0.5 leading-relaxed">
              Download a ZIP archive of all your account data including profile info, issue history, and comments. Processing may take a few minutes — we'll email you when it's ready.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-[12px] font-semibold flex-shrink-0"
            onClick={() => toast.success("Export requested — check your email shortly")}
          >
            Request export
          </Button>
        </div>

        <Separator />

        {/* Delete account */}
        <div className="flex items-start justify-between gap-4 p-5 bg-[#FFFAF9]">
          <div>
            <p className="text-[13px] font-bold text-[#DE350B] flex items-center gap-1.5">
              <AlertTriangle size={13} /> Delete account
            </p>
            <p className="text-[12px] text-[#5E6C84] mt-0.5 leading-relaxed">
              Permanently deletes your account, all your data, and removes you from all organizations. If you're the last owner of an organization, it will also be deleted. This cannot be reversed.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-8 text-[12px] font-semibold bg-[#DE350B] hover:bg-[#FF5630] text-white flex-shrink-0"
          >
            <Trash2 size={12} className="mr-1.5" /> Delete account
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-[8px] bg-[#FFEBE6] flex items-center justify-center">
                <AlertTriangle size={16} className="text-[#DE350B]" />
              </div>
              <AlertDialogTitle className="text-[16px] font-extrabold text-[#172B4D]">
                Delete your account?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[13px] text-[#5E6C84] leading-relaxed">
              This action is <strong className="text-[#172B4D]">permanent and irreversible</strong>.
              All your data — issues, comments, projects — will be permanently erased. Type{" "}
              <code className="bg-[#F4F5F7] px-1 py-0.5 rounded text-[#172B4D] font-mono text-[12px]">delete my account</code>{" "}
              to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="delete my account"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="text-[13px] mt-2"
          />
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-[13px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (confirmText !== "delete my account") {
                  toast.error("Type the confirmation phrase exactly");
                  return;
                }
                toast.error("Account deletion initiated");
                setDeleteDialogOpen(false);
              }}
              disabled={confirmText !== "delete my account"}
              className="bg-[#DE350B] hover:bg-[#FF5630] text-white text-[13px] font-semibold"
            >
              I understand, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ROOT: SettingsPage
// ══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const { user }          = useAuth();
  const [active, setActive] = useState("profile");

  const content = {
    profile:       <ProfileSection user={user} />,
    appearance:    <AppearanceSection />,
    integrations:  <IntegrationsSection />,
    notifications: <NotificationsSection />,
    security:      <SecuritySection />,
    danger:        <DangerSection />,
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F4F5F7]">

      {/* ── Sidebar ── */}
      <aside className="w-[220px] flex-shrink-0 border-r border-[#DFE1E6] bg-white flex flex-col py-6 px-3">
        <div className="px-2 mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#8993A4]">
            Account settings
          </p>
        </div>

        <nav className="space-y-0.5">
          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] text-left transition-colors ${
                active === id
                  ? "bg-[#DEEBFF] text-[#0052CC]"
                  : id === "danger"
                  ? "text-[#DE350B] hover:bg-[#FFEBE6]"
                  : "text-[#42526E] hover:bg-[#F4F5F7]"
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className={`text-[13px] font-semibold`}>{label}</span>
              {active === id && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </nav>

      
      </aside>

      {/* ── Content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[680px] mx-auto py-10 px-8">
          {content[active]}
        </div>
      </main>
    </div>
  );
}