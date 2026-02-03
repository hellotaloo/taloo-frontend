'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  Briefcase,
  Phone,
  Settings,
  Search,
  MoreHorizontal,
  Target,
  SlidersHorizontal,
  Smartphone,
  Users,
  UserPlus,
} from 'lucide-react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getVacancies } from '@/lib/interview-api';

// Navigation data
const mainNavItems = [
  { name: 'Nieuw gesprek', href: '/', icon: PencilSquareIcon },
];

const primaryNavItems = [
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Insights', href: '/insights', icon: Target },
];

const overzichtenItems = [
  { name: 'Pre-screening', href: '/pre-screening', icon: Phone, badgeKey: 'newVacancies' as const },
  { name: 'Vacatures', href: '/vacatures', icon: Briefcase },
  { name: 'Kandidaten', href: '/kandidaten', icon: Users },
  { name: 'Onboarding', href: '/onboarding', icon: UserPlus },
];

const footerNavItems = [
  { name: 'Finetune', href: '/finetune', icon: SlidersHorizontal },
  { name: 'Admin', href: '/admin', icon: Settings },
  { name: 'Zoeken', href: '/search', icon: Search },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [overzichtenOpen, setOverzichtenOpen] = React.useState(true);
  const [newVacanciesCount, setNewVacanciesCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    getVacancies()
      .then(({ vacancies }) => {
        if (cancelled) return;
        const count = vacancies.filter((v) => v.status === 'new').length;
        setNewVacanciesCount(count);
      })
      .catch(() => {
        if (!cancelled) setNewVacanciesCount(null);
      });
    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const getOverzichtBadge = (item: (typeof overzichtenItems)[number]): React.ReactNode => {
    if ('badgeKey' in item && item.badgeKey === 'newVacancies' && newVacanciesCount !== null) {
      return newVacanciesCount;
    }
    return undefined;
  };


  return (
    <Sidebar className="border-r-0">
      {/* Header - Workspace Switcher */}
      <SidebarHeader className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full hover:bg-sidebar-accent rounded-lg p-2 -m-2 transition-colors">
              <Image
                src="/mockup/itzu-logo-icon.png"
                alt="ITZU"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  ITZU
                </p>
                <p className="text-xs text-sidebar-foreground/60">Enterprise</p>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <span>ITZU</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>Switch workspace...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* New Conversation Button */}
        <SidebarGroup className="py-0 mt-6">
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Primary Navigation */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Overzichten Section */}
        <Collapsible open={overzichtenOpen} onOpenChange={setOverzichtenOpen}>
          <SidebarGroup className="py-0 mt-6">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group/label">
                <span>Overzichten</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {overzichtenItems.map((item) => {
                    const badge = getOverzichtBadge(item);
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
                    <AvatarImage src="/dummy-profile-ld.png" alt="Laurijn" />
                    <AvatarFallback>L</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">Laurijn</p>
                    <p className="text-xs text-sidebar-foreground/60">
                      laurijn@taloo.be
                    </p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-sidebar-foreground/60" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
