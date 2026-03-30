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
  Kanban,
  AlertCircle,
  Activity,
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
import { getNavigationCounts, getAvailableAgents, type NavigationCounts } from '@/lib/interview-api';
import { AGENT_REGISTRY, type AgentMeta } from '@/lib/agent-registry';
import { useAuth } from '@/contexts/auth-context';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { useTranslations } from '@/lib/i18n';

// Navigation data — nameKey references nav.* translations
const primaryNavItems = [
  { nameKey: 'dashboard', href: '/', icon: LayoutDashboard },
  { nameKey: 'activities', href: '/activities', icon: Activity },
  { nameKey: 'auditTrail', href: '/audit-trail', icon: History },
];

const viewItems = [
  { nameKey: 'pipelines', href: '/views/pipelines', icon: Kanban },
  { nameKey: 'vacancies', href: '/views/vacancies', icon: Briefcase },
  { nameKey: 'candidates', href: '/views/candidates', icon: Users },
  { nameKey: 'customers', href: '/views/customers', icon: Building2 },
];

const footerNavItems = [
  { nameKey: 'settings', href: '/admin', icon: Settings }
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
  const [viewsOpen, setViewsOpen] = React.useState(true);
  const [agentsOpen, setAgentsOpen] = React.useState(true);
  const [counts, setCounts] = React.useState<NavigationCounts | null>(null);
  const [agentItems, setAgentItems] = React.useState<AgentMeta[]>([]);
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  const fetchCounts = React.useCallback(() => {
    getNavigationCounts()
      .then(setCounts)
      .catch(() => setCounts(null));
  }, []);

  const fetchAgents = React.useCallback(() => {
    getAvailableAgents()
      .then((types) => {
        const items = types
          .map((t) => AGENT_REGISTRY[t])
          .filter((item): item is AgentMeta => !!item);
        setAgentItems(items);
      })
      .catch(() => setAgentItems([]));
  }, []);

  // Fetch on mount and when workspace changes
  React.useEffect(() => {
    fetchCounts();
    fetchAgents();
  }, [fetchCounts, fetchAgents, currentWorkspace?.id]);

  // Subscribe to navigation_counts table for instant updates
  useRealtimeTable({
    schema: 'ats',
    table: 'navigation_counts',
    event: 'UPDATE',
    onUpdate: () => fetchCounts(),
  });

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const activitiesCount = counts?.activities?.active ?? null;
  const hasStuckActivities = (counts?.activities?.stuck ?? 0) > 0;

  const getAgentBadge = (item: AgentMeta): React.ReactNode => {
    const section = counts?.[item.badgeKey];
    if (!section) return undefined;

    const active = section.active ?? 0;
    const stuck = section.stuck ?? 0;
    const total = active + stuck;

    if (total <= 0) return undefined;

    return (
      <span className="flex items-center gap-1">
        {total}
        {stuck > 0 && <AlertCircle className="h-3 w-3 text-orange-500" />}
      </span>
    );
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
                      {tCommon('adminWorkspace')}
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
                  <p className="text-xs text-gray-500">{tCommon('adminWorkspace')}</p>
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
                  <SidebarMenuItem key={item.nameKey}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{tNav(item.nameKey)}</span>
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
                <span>{tNav('agents')}</span>
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
                        <span>{tCommon('addAgent')}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Views Section */}
        <Collapsible open={viewsOpen} onOpenChange={setViewsOpen}>
          <SidebarGroup className="py-0 mt-6">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group/label">
                <span>{tNav('views')}</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {viewItems.map((item) => (
                    <SidebarMenuItem key={item.nameKey}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{tNav(item.nameKey)}</span>
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
            <SidebarMenuItem key={item.nameKey}>
              <SidebarMenuButton asChild isActive={isActive(item.href)}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span>{tNav(item.nameKey)}</span>
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
                      {user?.full_name || tCommon('user')}
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
                  {tCommon('profile')} ({tCommon('comingSoon')})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  {tCommon('logOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
