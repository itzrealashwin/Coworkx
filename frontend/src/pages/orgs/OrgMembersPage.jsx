import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  useOrganizationMembers,
  useRemoveOrganizationMember,
  useUpdateOrganizationMemberRole,
  useSendOrganizationInvitation,
} from "@/hooks/useOrganizations";
import { useAuth } from "@/hooks/useAuth";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select as SelectUI,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Trash2,
  UserPlus,
  Search,
  Users,
  ShieldCheck,
  Crown,
  Mail,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  owner: {
    label: "Owner",
    icon: Crown,
    className: "bg-[#FFF0B3] text-[#974F0C] border-[#FFE380]",
  },
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    className: "bg-[#EAE6FF] text-[#403294] border-[#C0B6F2]",
  },
  member: {
    label: "Member",
    icon: Users,
    className: "bg-[#E3FCEF] text-[#006644] border-[#ABF5D1]",
  },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-semibold border ${config.className}`}
    >
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-[8px] border border-[#DFE1E6] px-5 py-4 flex items-center gap-4 shadow-[0_1px_3px_rgba(9,30,66,0.08)]">
      <div
        className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div className="text-[24px] font-extrabold text-[#172B4D] leading-none">{value}</div>
        <div className="text-[12px] font-medium text-[#5E6C84] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Invite Dialog ────────────────────────────────────────────────────────────
function InviteMemberDialog({ open, onOpenChange, orgSlug, sendInviteMutation }) {
  const [email, setEmail]   = useState("");
  const [role, setRole]     = useState("member");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await sendInviteMutation.mutateAsync({ orgSlug, payload: { email, role } });
      toast.success("Invitation sent successfully");
      setEmail("");
      setRole("member");
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-[8px] bg-[#DEEBFF] flex items-center justify-center">
              <UserPlus size={16} className="text-[#0052CC]" />
            </div>
            <div>
              <DialogTitle className="text-[16px] font-extrabold text-[#172B4D]">
                Invite Team Member
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#5E6C84] mt-0">
                They'll receive an email to join this workspace.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-[13px] font-semibold text-[#172B4D]">
              Email address <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8993A4]" size={14} />
              <Input
                id="invite-email"
                type="email"
                placeholder="teammate@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 text-[13px]"
              />
            </div>
          </div>

          {/* Role field */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-[13px] font-semibold text-[#172B4D]">
              Role
            </Label>
            <SelectUI value={role} onValueChange={setRole}>
              <SelectTrigger id="invite-role" className="text-[13px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} className="text-[#403294]" />
                    <span>Admin</span>
                    <span className="text-[11px] text-[#5E6C84] ml-1">— Full workspace control</span>
                  </div>
                </SelectItem>
                <SelectItem value="member">
                  <div className="flex items-center gap-2">
                    <Users size={13} className="text-[#006644]" />
                    <span>Member</span>
                    <span className="text-[11px] text-[#5E6C84] ml-1">— Standard access</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </SelectUI>
          </div>

          {/* Info box */}
          <div className="bg-[#DEEBFF] rounded-[6px] px-4 py-3 flex items-start gap-2.5">
            <Mail size={13} className="text-[#0052CC] mt-0.5 shrink-0" />
            <p className="text-[12px] text-[#0052CC] leading-relaxed">
              An invitation email will be sent to <strong>{email || "this address"}</strong> with a
              link to join your workspace.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sendInviteMutation.isPending || !email}
              className="bg-[#0052CC] hover:bg-[#0065FF] text-white text-[13px] font-semibold"
            >
              {sendInviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Members Table ────────────────────────────────────────────────────────────
function MembersTable({ members, orgSlug, currentUser, updateRoleMutation, onRemoveClick }) {
  return (
    <div className="rounded-[8px] border border-[#DFE1E6] overflow-hidden bg-white shadow-[0_1px_3px_rgba(9,30,66,0.08)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F4F5F7] hover:bg-[#F4F5F7]">
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] py-3">
              Member
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] py-3">
              Email
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] py-3">
              Role
            </TableHead>
            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[#5E6C84] py-3 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                <div className="flex flex-col items-center gap-2 text-[#5E6C84]">
                  <Users size={28} className="opacity-30" />
                  <p className="text-[14px] font-medium">No members yet</p>
                  <p className="text-[13px]">Invite someone to get started</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => {
              const isSelf    = member.user.id === currentUser?.id;
              const isOwner   = member.role === "owner";
              const isLocked  = isOwner || isSelf;

              return (
                <TableRow
                  key={member.id}
                  className="hover:bg-[#FAFBFC] transition-colors group border-b border-[#F4F5F7] last:border-0"
                >
                  {/* Name + Avatar */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 border border-[#DFE1E6]">
                        <AvatarImage
                          src={member.user.avatarUrl || `https://avatar.vercel.sh/${member.user.email}`}
                          alt={member.user.displayName}
                        />
                        <AvatarFallback className="bg-[#DEEBFF] text-[#0052CC] text-[12px] font-bold">
                          {(member.user.displayName || member.user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-[14px] font-semibold text-[#172B4D] flex items-center gap-1.5">
                          {member.user.displayName || member.user.username || "Unnamed"}
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#DEEBFF] text-[#0052CC]">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8993A4]">@{member.user.username || "—"}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-[13px] text-[#5E6C84] py-3.5">
                    {member.user.email}
                  </TableCell>

                  {/* Role */}
                  <TableCell className="py-3.5">
                    {isLocked ? (
                      <RoleBadge role={member.role} />
                    ) : (
                      <SelectUI
                        defaultValue={member.role}
                        onValueChange={(val) =>
                          updateRoleMutation.mutate(
                            { orgSlug, userId: member.user.id, role: val },
                            {
                              onSuccess: () => toast.success("Role updated"),
                              onError:   (e) => toast.error(e.response?.data?.message || "Failed"),
                            }
                          )
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-[130px] h-7 text-[12px] border-[#DFE1E6] focus:ring-[#0052CC]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin" className="text-[13px]">Admin</SelectItem>
                          <SelectItem value="member" className="text-[13px]">Member</SelectItem>
                        </SelectContent>
                      </SelectUI>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-right py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isLocked}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="text-[13px] cursor-pointer text-[#DE350B] focus:text-[#DE350B] focus:bg-[#FFEBE6]"
                          onClick={() => onRemoveClick(member)}
                        >
                          <Trash2 size={13} className="mr-2" />
                          Remove member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Remove Confirm Dialog ─────────────────────────────────────────────────────
function RemoveMemberDialog({ member, onConfirm, onCancel, isPending }) {
  return (
    <AlertDialog open={!!member} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-[8px] bg-[#FFEBE6] flex items-center justify-center">
              <Trash2 size={16} className="text-[#DE350B]" />
            </div>
            <AlertDialogTitle className="text-[16px] font-extrabold text-[#172B4D]">
              Remove member?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[13px] text-[#5E6C84] leading-relaxed">
            <span className="font-semibold text-[#172B4D]">
              {member?.user.displayName || member?.user.email}
            </span>{" "}
            will lose access to all projects in this organization. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-2">
          <AlertDialogCancel disabled={isPending} className="text-[13px]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={isPending}
            className="bg-[#DE350B] hover:bg-[#FF5630] text-white text-[13px] font-semibold"
          >
            {isPending ? "Removing…" : "Remove member"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function MembersPageSkeleton() {
  return (
    <div className="p-8 space-y-6 flex-1 bg-[#F4F5F7]">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-[6px]" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-[8px]" />)}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-[8px]" />
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-[8px]" />)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrgMembersPage() {
  const { orgSlug }              = useParams();
  const { user: currentUser }    = useAuth();

  const [memberToRemove, setMemberToRemove]   = useState(null);
  const [isInviteOpen, setIsInviteOpen]       = useState(false);
  const [searchQuery, setSearchQuery]         = useState("");

  const { data: membersResponse, isLoading }  = useOrganizationMembers(orgSlug);
  const updateRoleMutation                    = useUpdateOrganizationMemberRole();
  const removeMemberMutation                  = useRemoveOrganizationMember();
  const sendInviteMutation                    = useSendOrganizationInvitation();

  const rawMembers = membersResponse?.members || membersResponse || [];

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return rawMembers;
    const q = searchQuery.toLowerCase();
    return rawMembers.filter(
      (m) =>
        m.user.displayName?.toLowerCase().includes(q) ||
        m.user.email?.toLowerCase().includes(q) ||
        m.user.username?.toLowerCase().includes(q)
    );
  }, [rawMembers, searchQuery]);

  const stats = useMemo(() => ({
    total:  rawMembers.length,
    admins: rawMembers.filter((m) => m.role === "admin").length,
    owners: rawMembers.filter((m) => m.role === "owner").length,
  }), [rawMembers]);

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberMutation.mutateAsync({ orgSlug, userId: memberToRemove.user.id });
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    } finally {
      setMemberToRemove(null);
    }
  };

  if (isLoading) return <MembersPageSkeleton />;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F5F7] p-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-[#172B4D] flex items-center gap-2">
            <UserCog size={22} className="text-[#0052CC]" />
            Members
          </h1>
          <p className="text-[13px] font-medium text-[#5E6C84] mt-1">
            Manage who has access to this workspace and their permissions.
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-[#0052CC] hover:bg-[#0065FF] text-white font-bold text-[13px] px-4 py-2 h-9 rounded-[4px] flex items-center gap-2"
        >
          <UserPlus size={14} />
          Invite Member
        </Button>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users}       label="Total Members"  value={stats.total}  color="#0052CC" />
        <StatCard icon={ShieldCheck} label="Admins"         value={stats.admins} color="#6554C0" />
        <StatCard icon={Crown}       label="Owners"         value={stats.owners} color="#FF8B00" />
      </div>

      {/* ── Search bar ── */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8993A4]"
        />
        <Input
          placeholder="Search by name, email or username…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-[13px] bg-white border-[#DFE1E6] shadow-[0_1px_3px_rgba(9,30,66,0.06)]"
        />
        {searchQuery && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#5E6C84]">
            {filteredMembers.length} result{filteredMembers.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <MembersTable
        members={filteredMembers}
        orgSlug={orgSlug}
        currentUser={currentUser}
        updateRoleMutation={updateRoleMutation}
        onRemoveClick={setMemberToRemove}
      />

      {/* ── Dialogs ── */}
      <InviteMemberDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        orgSlug={orgSlug}
        sendInviteMutation={sendInviteMutation}
      />

      <RemoveMemberDialog
        member={memberToRemove}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setMemberToRemove(null)}
        isPending={removeMemberMutation.isPending}
      />
    </div>
  );
}