'use client';

import { Card, Badge, Text, Heading, Flex } from '@radix-ui/themes';
import { MapPin, Building2, MoreHorizontal, Clock } from 'lucide-react';
import Link from 'next/link';
import { Vacancy } from '@/lib/types';

interface VacancyCardProps {
  vacancy: Vacancy;
}

const statusConfig: Record<string, { label: string; color: 'blue' | 'orange' | 'green' | 'gray' }> = {
  new: { label: 'New', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'orange' },
  agent_created: { label: 'Agent Created', color: 'green' },
  archived: { label: 'Archived', color: 'gray' },
};

export function VacancyCard({ vacancy }: VacancyCardProps) {
  const status = statusConfig[vacancy.status] || { label: vacancy.status, color: 'gray' };
  
  return (
    <Link href={`/vacancies/${vacancy.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
        <Flex justify="between" align="start" className="mb-3">
          <Badge color={status.color} variant="soft" size="1">
            {status.label}
          </Badge>
          <button 
            className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              // Menu action
            }}
          >
            <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </Flex>

        <Heading size="3" className="text-[var(--text-primary)] mb-2">
          {vacancy.title}
        </Heading>

        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
            <Text size="2" className="text-[var(--text-secondary)]">
              {vacancy.company}
            </Text>
          </Flex>
          
          <Flex align="center" gap="2">
            <MapPin className="w-4 h-4 text-[var(--text-secondary)]" />
            <Text size="2" className="text-[var(--text-secondary)]">
              {vacancy.location}
            </Text>
          </Flex>

          <Flex align="center" gap="2">
            <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            <Text size="1" className="text-[var(--text-secondary)]">
              {new Date(vacancy.createdAt).toLocaleDateString('nl-BE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </Text>
          </Flex>
        </Flex>

        <Text size="2" className="text-[var(--text-secondary)] mt-3 line-clamp-2">
          {vacancy.description}
        </Text>
      </Card>
    </Link>
  );
}
