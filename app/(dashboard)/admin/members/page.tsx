'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  MoreHorizontal,
  Shield,
  Trash2,
  Mail,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useAuth } from '@/contexts/auth-context';
import { useTranslations, useLocale } from '@/lib/i18n';
import { formatRelativeDate } from '@/lib/utils';
import {
  type WorkspaceMember,
  type WorkspaceInvitation,
  type MemberRole,
  getWorkspaceMembers,
  getWorkspaceInvitations,
  inviteMember,
  cancelInvitation,
  updateMemberRole,
  removeMember,
} from '@/lib/workspace-members-api';

// --- Helpers ---

const ROLE_RANK: Record<MemberRole, number> = {
  super_admin: 4,
  owner: 3,
  admin: 2,
  member: 1,
};

const ROLE_LABELS: Record<MemberRole, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  admin: 'Admin',
  member: 'Lid',
};

function getRoleBadge(role: MemberRole) {
  switch (role) {
    case 'super_admin':
    case 'owner':
      return (
        <span className="inline-flex items-center rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-white">
          {ROLE_LABELS[role]}
        </span>
      );
    case 'admin':
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Admin
        </span>
      );
    case 'member':
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
          Lid
        </span>
      );
  }
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() || '?';
}

// --- Page ---

export default function MembersPage() {
  const { user, currentWorkspace } = useAuth();
  const t = useTranslations('members');
  const { locale } = useLocale();
  const workspaceId = currentWorkspace?.id;
  const userRole = (currentWorkspace?.role || 'member') as MemberRole;

  // Data
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite dialog
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  // Role change dialog
  const [roleChangeTarget, setRoleChangeTarget] = useState<WorkspaceMember | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'member'>('member');
  const [updatingRole, setUpdatingRole] = useState(false);

  // Remove member dialog
  const [removeTarget, setRemoveTarget] = useState<WorkspaceMember | null>(null);
  const [removing, setRemoving] = useState(false);

  // Cancel invitation dialog
  const [cancelTarget, setCancelTarget] = useState<WorkspaceInvitation | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Permissions
  const canInvite = ROLE_RANK[userRole] >= ROLE_RANK['admin'];
  const canManage = (targetRole: MemberRole) => ROLE_RANK[userRole] > ROLE_RANK[targetRole];

  // Assignable roles based on current user's role
  const assignableRoles: ('admin' | 'member')[] =
    ROLE_RANK[userRole] >= ROLE_RANK['owner'] ? ['admin', 'member'] : ['member'];

  // --- Data fetching ---

  const fetchData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const promises: [Promise<WorkspaceMember[]>, Promise<WorkspaceInvitation[]>?] = [
        getWorkspaceMembers(workspaceId),
      ];
      if (canInvite) {
        promises.push(getWorkspaceInvitations(workspaceId));
      }
      const results = await Promise.all(promises);
      setMembers(results[0]);
      if (results[1]) setInvitations(results[1]);
    } catch {
      toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [workspaceId, canInvite]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  const handleInvite = async () => {
    if (!workspaceId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const result = await inviteMember(workspaceId, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      if (result.status === 'added') {
        toast.success(t('memberAdded'));
      } else {
        toast.success(t('invitationSent'));
      }
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inviteFailed'));
    } finally {
      setInviting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!workspaceId || !roleChangeTarget) return;
    setUpdatingRole(true);
    try {
      await updateMemberRole(workspaceId, roleChangeTarget.user_id, { role: newRole });
      setMembers((prev) =>
        prev.map((m) =>
          m.user_id === roleChangeTarget.user_id ? { ...m, role: newRole } : m
        )
      );
      toast.success(t('roleUpdated'));
      setRoleChangeTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('roleUpdateFailed'));
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!workspaceId || !removeTarget) return;
    setRemoving(true);
    try {
      await removeMember(workspaceId, removeTarget.user_id);
      setMembers((prev) => prev.filter((m) => m.user_id !== removeTarget.user_id));
      toast.success(t('memberRemoved'));
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('memberRemoveFailed'));
    } finally {
      setRemoving(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!workspaceId || !cancelTarget) return;
    setCancelling(true);
    try {
      await cancelInvitation(workspaceId, cancelTarget.id);
      setInvitations((prev) => prev.filter((i) => i.id !== cancelTarget.id));
      toast.success(t('invitationCancelled'));
      setCancelTarget(null);
    } catch {
      toast.error(t('invitationCancelFailed'));
    } finally {
      setCancelling(false);
    }
  };

  // --- Render ---

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">{t('title')}</h1>
          </div>
          {canInvite && (
            <Button
              size="sm"
              onClick={() => setInviteDialogOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              {t('invite')}
            </Button>
          )}
        </div>
      </PageLayoutHeader>

      <PageLayoutContent>
        <div className="max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Members section */}
              <section>
                <h2 className="text-sm font-medium text-gray-500 mb-3">
                  {t('membersCount')} ({members.length})
                </h2>
                <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                  {members.map((member, idx) => {
                    const isSelf = member.user_id === user?.id;
                    const showActions = !isSelf && canManage(member.role);

                    return (
                      <div
                        key={member.user_id}
                        className={`flex items-center gap-4 px-5 py-3.5 ${isSelf ? 'bg-gray-50/50' : ''}`}
                        style={{ animation: `fade-in-up 0.3s ease-out ${100 + idx * 50}ms backwards` }}
                      >
                        <Avatar>
                          {member.avatar_url ? (
                            <AvatarImage src={member.avatar_url} alt={member.full_name} />
                          ) : null}
                          <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {member.full_name || member.email}
                            </span>
                            {isSelf && (
                              <span className="text-xs text-gray-400">{t('you')}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {getRoleBadge(member.role)}
                          <span className="text-xs text-gray-400 hidden sm:block">
                            {formatRelativeDate(member.joined_at, locale)}
                          </span>

                          {showActions ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setRoleChangeTarget(member);
                                    setNewRole(member.role === 'admin' ? 'member' : 'admin');
                                  }}
                                >
                                  <Shield className="w-4 h-4 mr-2" />
                                  {t('changeRole')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => setRemoveTarget(member)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('remove')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            /* spacer to keep alignment */
                            <div className="w-8" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <div className="px-5 py-10 text-center text-sm text-gray-400">
                      {t('noMembers')}
                    </div>
                  )}
                </div>
              </section>

              {/* Invitations section */}
              {canInvite && (
                <section
                  style={{ animation: `fade-in-up 0.3s ease-out ${100 + members.length * 50 + 100}ms backwards` }}
                >
                  <h2 className="text-sm font-medium text-gray-500 mb-3">
                    {t('pendingInvitations')} ({invitations.length})
                  </h2>
                  <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                    {invitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center gap-4 px-5 py-3.5"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-gray-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {invitation.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invitation.invited_by_name
                              ? t('invitedBy', { name: invitation.invited_by_name })
                              : t('invited')}
                            {invitation.created_at && ` · ${formatRelativeDate(invitation.created_at, locale)}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {getRoleBadge(invitation.role as MemberRole)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                            onClick={() => setCancelTarget(invitation)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {invitations.length === 0 && (
                      <div className="px-5 py-10 text-center text-sm text-gray-400">
                        {t('noInvitations')}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </PageLayoutContent>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('inviteTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">{t('email')}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t('emailPlaceholder')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inviteEmail.trim()) handleInvite();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">{t('role')}</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as 'admin' | 'member')}
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.includes('admin') && (
                    <SelectItem value="admin">Admin</SelectItem>
                  )}
                  <SelectItem value="member">{t('member')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
            >
              {inviting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {t('invite')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => { if (!open) setRoleChangeTarget(null); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('changeRole')}</DialogTitle>
          </DialogHeader>
          {roleChangeTarget && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                {t('changeRoleDesc')} <strong>{roleChangeTarget.full_name || roleChangeTarget.email}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-role">{t('newRole')}</Label>
                <Select
                  value={newRole}
                  onValueChange={(v) => setNewRole(v as 'admin' | 'member')}
                >
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeTarget(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updatingRole || newRole === roleChangeTarget?.role}
            >
              {updatingRole && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member AlertDialog */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removeMemberTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removeMemberDesc', { name: removeTarget?.full_name || removeTarget?.email || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removing}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {removing && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invitation AlertDialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cancelInviteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cancelInviteDesc', { email: cancelTarget?.email || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelInvitation}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {cancelling && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
              {t('cancel')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
}
