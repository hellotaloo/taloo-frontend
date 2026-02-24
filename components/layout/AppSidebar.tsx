'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Settings,
  SlidersHorizontal,
  FileCheck,
  LayoutList,
  LogOut,
  User,
  Check,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { PencilSquareIcon, BoltIcon } from '@heroicons/react/24/outline';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNavigationCounts } from '@/lib/interview-api';
import { useAuth } from '@/contexts/auth-context';

// Navigation data
const primaryNavItems = [
  { name: 'Nieuwe chat', href: '/', icon: PencilSquareIcon },
  { name: 'Overzichten', href: '/overviews', icon: LayoutList },
  { name: 'Agent activiteiten', href: '/activities', icon: BoltIcon },
];

const agentItems = [
  { name: 'Pre-screening', href: '/pre-screening', icon: Phone, badgeKey: 'prescreening' as const },
  { name: 'Pre-onboarding', href: '/pre-onboarding', icon: FileCheck, badgeKey: 'preonboarding' as const },
];

const footerNavItems = [
  { name: 'Finetune', href: '/finetune', icon: SlidersHorizontal },
  { name: 'Admin', href: '/admin', icon: Settings }
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadge(role: 'owner' | 'admin' | 'member'): string {
  const labels: Record<string, string> = {
    owner: 'Eigenaar',
    admin: 'Admin',
    member: 'Lid',
  };
  return labels[role] || role;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, workspaces, currentWorkspace, switchWorkspace, logout } = useAuth();
  const [agentsOpen, setAgentsOpen] = React.useState(true);
  const [prescreeningCount, setPrescreeningCount] = React.useState<number | null>(null);
  const [preonboardingCount, setPreonboardingCount] = React.useState<number | null>(null);
  const [activitiesCount, setActivitiesCount] = React.useState<number | null>(null);
  const [hasStuckActivities, setHasStuckActivities] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    getNavigationCounts()
      .then((counts) => {
        if (cancelled) return;
        setPrescreeningCount(counts.prescreening.new);
        setPreonboardingCount(counts.preonboarding.new);
        if (counts.activities) {
          setActivitiesCount(counts.activities.active);
          setHasStuckActivities(counts.activities.stuck > 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrescreeningCount(null);
          setPreonboardingCount(null);
          setActivitiesCount(null);
          setHasStuckActivities(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const getAgentBadge = (item: (typeof agentItems)[number]): React.ReactNode => {
    if (!('badgeKey' in item)) return undefined;

    if (item.badgeKey === 'prescreening' && prescreeningCount !== null && prescreeningCount > 0) {
      return prescreeningCount;
    }
    if (item.badgeKey === 'preonboarding' && preonboardingCount !== null && preonboardingCount > 0) {
      return preonboardingCount;
    }
    return undefined;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar className="border-r-0">
      {/* Header - Workspace Switcher */}
      <SidebarHeader className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-sidebar-accent rounded-lg p-2 -m-2 transition-colors">
              {currentWorkspace?.logo_url ? (
                <Image
                  src={currentWorkspace.logo_url}
                  alt={currentWorkspace.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-lg object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-white text-sm font-semibold">
                  TD
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  Taloo Demo
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  Enterprise
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => switchWorkspace(workspace.id)}
                className="flex items-center gap-3 py-2"
              >
                {workspace.logo_url ? (
                  <Image
                    src={workspace.logo_url}
                    alt={workspace.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs font-medium text-white">
                    {getInitials(workspace.name)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{workspace.name}</p>
                  <p className="text-xs text-gray-500">{getRoleBadge(workspace.role)}</p>
                </div>
                {workspace.id === currentWorkspace?.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary Navigation */}
        <SidebarGroup className="py-0 mt-6">
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => {
                const isActivities = item.href === '/activities';
                const showActivitiesCount = isActivities && activitiesCount !== null && activitiesCount > 0;
                const showStuckWarning = isActivities && hasStuckActivities;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                    {(showActivitiesCount || showStuckWarning) && (
                      <SidebarMenuBadge className="flex items-center gap-1">
                        {showActivitiesCount && activitiesCount}
                        {showStuckWarning && (
                          <AlertCircle className="h-3 w-3 text-orange-500" />
                        )}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Agents Section */}
        <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
          <SidebarGroup className="py-0 mt-6">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group/label">
                <span>Agents</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {agentItems.map((item) => {
                    const badge = getAgentBadge(item);
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive(item.href)}>
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        {badge !== undefined && (
                          <SidebarMenuBadge>{badge}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <SidebarMenu>
          {footerNavItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive(item.href)}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* User Profile */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.full_name || 'User'}
                    />
                    <AvatarFallback>
                      {user?.full_name ? getInitials(user.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.full_name || 'Gebruiker'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profiel
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Instellingen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
