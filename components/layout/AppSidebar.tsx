'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  LogOut,
  User,
  Users,
  Check,
  Phone,
  AlertCircle,
  Activity,
  FileCheck,
  History,
  LayoutDashboard,
  Plus,
} from 'lucide-react';

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
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Activiteiten', href: '/activities', icon: Activity },
  { name: 'Audit trail', href: '/audit-trail', icon: History },
];

const recordItems = [
  { name: 'Vacatures', href: '/records/vacancies', icon: Briefcase },
  { name: 'Kandidaten', href: '/records/candidates', icon: Users },
  { name: 'Klanten', href: '/records/customers', icon: Building2 },
];

const agentItems = [
  { name: 'Pre-screening', href: '/pre-screening', icon: Phone, badgeKey: 'prescreening' as const },
  { name: 'Document collectie', href: '/document-collection', icon: FileCheck },
];

const footerNavItems = [
  { name: 'Settings', href: '/admin', icon: Settings }
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AppSidebar() {
  const pathname = usePathname();
  const { user, workspaces, currentWorkspace, switchWorkspace, logout } = useAuth();
  const [recordsOpen, setRecordsOpen] = React.useState(true);
  const [agentsOpen, setAgentsOpen] = React.useState(true);
  const [prescreeningCount, setPrescreeningCount] = React.useState<number | null>(null);
  const [activitiesCount, setActivitiesCount] = React.useState<number | null>(null);
  const [hasStuckActivities, setHasStuckActivities] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    const fetchCounts = () => {
      getNavigationCounts()
        .then((counts) => {
          if (cancelled) return;
          setPrescreeningCount(counts.prescreening.new);
          if (counts.activities) {
            setActivitiesCount(counts.activities.active);
            setHasStuckActivities(counts.activities.stuck > 0);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPrescreeningCount(null);
            setActivitiesCount(null);
            setHasStuckActivities(false);
          }
        });
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const getAgentBadge = (item: (typeof agentItems)[number]): React.ReactNode => {
    if (!('badgeKey' in item)) return undefined;

    if (item.badgeKey === 'prescreening' && prescreeningCount !== null && prescreeningCount > 0) {
      return prescreeningCount;
    }
    return undefined;
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar className="border-r-0">
      {/* Header - Workspace Switcher */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  {currentWorkspace?.logo_url ? (
                    <Image
                      src={currentWorkspace.logo_url}
                      alt={currentWorkspace.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-white text-xs font-semibold">
                      {currentWorkspace ? getInitials(currentWorkspace.name) : 'W'}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-sidebar-foreground">
                      {currentWorkspace?.name || 'Workspace'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">
                      Admin workspace
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
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
                  <p className="text-xs text-gray-500">Admin workspace</p>
                </div>
                {workspace.id === currentWorkspace?.id && (
                  <Check className="h-4 w-4 text-green-600" />
                )}
              </DropdownMenuItem>
            ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
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
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className="text-sidebar-foreground/60">
                      <Link href="/agents">
                        <Plus className="h-4 w-4" />
                        <span>Voeg agent toe</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Records Section */}
        <Collapsible open={recordsOpen} onOpenChange={setRecordsOpen}>
          <SidebarGroup className="py-0 mt-6">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group/label">
                <span>Records</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {recordItems.map((item) => (
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
                <DropdownMenuItem disabled>
                  <User className="h-4 w-4 mr-2" />
                  Profiel (coming soon)
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
