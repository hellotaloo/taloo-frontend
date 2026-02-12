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
  SlidersHorizontal,
  Smartphone,
  Users,
  UserPlus,
  FileCheck,
  ScanSearch,
  LayoutList,
  Activity,
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
import { getPreScreeningVacancies, getPreOnboardingVacancies } from '@/lib/interview-api';

// Navigation data
const mainNavItems = [
  { name: 'Nieuw gesprek', href: '/', icon: PencilSquareIcon },
];

const primaryNavItems = [
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Overzichten', href: '/overviews', icon: LayoutList },
  { name: 'Activiteiten', href: '/activities', icon: Activity },
];

const assistentenItems = [
  { name: 'Pre-screening', href: '/pre-screening', icon: Phone, badgeKey: 'prescreening' as const },
  { name: 'Pre-onboarding', href: '/pre-onboarding', icon: FileCheck, badgeKey: 'preonboarding' as const },
  { name: 'Pattern Finder', href: '/insights', icon: ScanSearch },
];

const footerNavItems = [
  { name: 'Finetune', href: '/finetune', icon: SlidersHorizontal },
  { name: 'Admin', href: '/admin', icon: Settings }
];

export function AppSidebar() {
  const pathname = usePathname();
  const [assistentenOpen, setAssistentenOpen] = React.useState(true);
  const [prescreeningCount, setPrescreeningCount] = React.useState<number | null>(null);
  const [preonboardingCount, setPreonboardingCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPreScreeningVacancies('new'),
      getPreOnboardingVacancies('new'),
    ])
      .then(([prescreeningData, preonboardingData]) => {
        if (cancelled) return;
        setPrescreeningCount(prescreeningData.total);
        setPreonboardingCount(preonboardingData.total);
      })
      .catch(() => {
        if (!cancelled) {
          setPrescreeningCount(null);
          setPreonboardingCount(null);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  const getAssistentBadge = (item: (typeof assistentenItems)[number]): React.ReactNode => {
    if (!('badgeKey' in item)) return undefined;

    if (item.badgeKey === 'prescreening' && prescreeningCount !== null && prescreeningCount > 0) {
      return prescreeningCount;
    }
    if (item.badgeKey === 'preonboarding' && preonboardingCount !== null && preonboardingCount > 0) {
      return preonboardingCount;
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
                src="/taloo-icon-big.svg"
                alt="ITZU"
                width={40}
                height={40}
                className="w-10 h-10 rounded-lg object-contain"
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-sidebar-foreground">
                  Taloo
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

        {/* Assistenten Section */}
        <Collapsible open={assistentenOpen} onOpenChange={setAssistentenOpen}>
          <SidebarGroup className="py-0 mt-6">
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center gap-2 w-full group/label">
                <span>Assistenten</span>
                <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/label:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {assistentenItems.map((item) => {
                    const badge = getAssistentBadge(item);
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
