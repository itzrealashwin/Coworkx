import React, { useState } from "react";
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
  DropdownMenuLabel,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
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
import { MoreHorizontal, Trash2, Mail } from "lucide-react";
import { toast } from "sonner"; // Assuming you have sonner for toasts

export default function OrgMembersPage() {
  const { orgSlug } = useParams();
  const { user: currentUser } = useAuth();

  // State for UI controls
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);

  // Form state for invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Queries
  const { data: membersResponse, isLoading: isLoadingMembers } =
    useOrganizationMembers(orgSlug);

  const members = membersResponse?.members || membersResponse || []; // Handle array or object structure based on actual API

  // Mutations
  const updateRoleMutation = useUpdateOrganizationMemberRole();
  const removeMemberMutation = useRemoveOrganizationMember();
  const sendInviteMutation = useSendOrganizationInvitation();

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateRoleMutation.mutateAsync({
        orgSlug,
        userId,
        role: newRole,
      });
      toast.success("Role updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update role");
    }
  };

  const handleRemoveConfirm = async () => {
    if (!memberToRemove) return;
    try {
      await removeMemberMutation.mutateAsync({
        orgSlug,
        userId: memberToRemove.user.id,
      });
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      await sendInviteMutation.mutateAsync({
        orgSlug,
        payload: {
          email: inviteEmail,
          role: inviteRole,
        },
      });
      toast.success("Invitation sent successfully");
      setIsInviteSheetOpen(false);
      setInviteEmail(""); // Reset
      setInviteRole("member");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    }
  };

  if (isLoadingMembers) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your organization members and their roles.
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 flex-1">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Members</h2>
          <p className="text-muted-foreground">
            Manage your organization members and their corresponding roles.
          </p>
        </div>

        <Sheet open={isInviteSheetOpen} onOpenChange={setIsInviteSheetOpen}>
  <SheetTrigger asChild>
    <Button>
      <Mail className="mr-2 h-4 w-4" />
      Invite Member
    </Button>
  </SheetTrigger>

  <SheetContent className="sm:max-w-md flex flex-col">
    <form
      onSubmit={handleInviteSubmit}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <SheetHeader className="pb-6">
        <SheetTitle>Invite Member</SheetTitle>
        <SheetDescription>
          Send an email invitation to add a new member to this organization.
        </SheetDescription>
      </SheetHeader>

      {/* Body */}
      <div className="flex flex-col gap-5 p-4 border rounded-md bg-card">
        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>

          <SelectUI value={inviteRole} onValueChange={setInviteRole}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
            </SelectContent>
          </SelectUI>
        </div>
      </div>

      {/* Footer */}
      <SheetFooter className="mt-auto pt-6 border-t">
        <Button
          type="submit"
          className="w-full"
          disabled={sendInviteMutation.isPending}
        >
          {sendInviteMutation.isPending
            ? "Sending invitation..."
            : "Send Invitation"}
        </Button>
      </SheetFooter>
    </form>
  </SheetContent>
</Sheet>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members && members.length > 0 ? (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={
                          member.user.avatarUrl ||
                          `https://avatar.vercel.sh/${member.user.email}`
                        }
                        alt={member.user.displayName || member.user.username}
                      />
                      <AvatarFallback>
                        {(
                          member.user.displayName ||
                          member.user.username ||
                          member.user.email ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {member.user.displayName ||
                          member.user.username ||
                          "Unnamed User"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    <SelectUI
                      defaultValue={member.role}
                      onValueChange={(value) =>
                        handleRoleChange(member.user.id, value)
                      }
                      disabled={
                        updateRoleMutation.isPending ||
                        member.role === "owner" ||
                        member.user.id === currentUser?.id
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        {member.role === "owner" && (
                          <SelectItem value="owner" disabled>
                            Owner
                          </SelectItem>
                        )}
                      </SelectContent>
                    </SelectUI>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          disabled={
                            member.role === "owner" ||
                            member.user.id === currentUser?.id
                          }
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove{" "}
              <span className="font-semibold text-foreground">
                {memberToRemove?.user.displayName ||
                  memberToRemove?.user.username ||
                  memberToRemove?.user.email}
              </span>{" "}
              from the organization and remove their access to all projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMemberMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRemoveConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? "Removing..." : "Remove Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
