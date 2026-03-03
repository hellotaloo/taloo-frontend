'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ServiceStatus = 'online' | 'offline' | 'degraded';

interface Service {
  name: string;
  icon: string;
  status: ServiceStatus;
  description?: string;
}

// Mock service statuses - in a real app, these would come from an API
const services: Service[] = [
  {
    name: 'Taloo Agent',
    icon: '/taloo-icon-big.svg',
    status: 'online',
    description: 'AI agent is operational',
  },
  {
    name: 'WhatsApp',
    icon: '/whatsapp.png',
    status: 'online',
    description: 'Connected and ready',
  },
  {
    name: 'Voice (Twilio)',
    icon: '/phone.png',
    status: 'online',
    description: 'All lines active',
  },
  {
    name: 'Salesforce',
    icon: '/salesforc-logo-cloud.png',
    status: 'online',
    description: 'Sync enabled',
  },
];

function getOverallStatus(services: Service[]): ServiceStatus {
  if (services.some((s) => s.status === 'offline')) return 'offline';
  if (services.some((s) => s.status === 'degraded')) return 'degraded';
  return 'online';
}

function getStatusColor(status: ServiceStatus): string {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'degraded':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-red-500';
  }
}

function getStatusText(status: ServiceStatus): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'degraded':
      return 'Degraded';
    case 'offline':
      return 'Offline';
  }
}

function StatusDot({ status, size = 'sm' }: { status: ServiceStatus; size?: 'sm' | 'xs' }) {
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : 'w-1.5 h-1.5';
  return (
    <span className={`${sizeClasses} rounded-full ${getStatusColor(status)} inline-block`} />
  );
}

export function SystemStatus() {
  const overallStatus = getOverallStatus(services);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors focus:outline-none"
          aria-label="System status"
        >
          <span className="relative flex items-center justify-center">
            <StatusDot status={overallStatus} />
            {overallStatus === 'online' && (
              <span className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>System Status</span>
          <span className="flex items-center gap-1.5 text-xs font-normal text-gray-500">
            <StatusDot status={overallStatus} size="xs" />
            {getStatusText(overallStatus)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-1">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center gap-3 px-2 py-2 rounded-sm hover:bg-gray-50"
            >
              <div className="w-5 h-5 relative shrink-0">
                <Image
                  src={service.icon}
                  alt={service.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {service.name}
                  </span>
                  <StatusDot status={service.status} size="xs" />
                </div>
                {service.description && (
                  <p className="text-xs text-gray-500 truncate">{service.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
