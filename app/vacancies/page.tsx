'use client';

import { useState, useMemo, useEffect } from 'react';
import { Heading, Text, Flex, TextField, Select, Button } from '@radix-ui/themes';
import { Search, Plus, Loader2 } from 'lucide-react';
import { VacancyList } from '@/components/vacancies/VacancyList';
import { getVacancies } from '@/lib/interview-api';
import { Vacancy } from '@/lib/types';

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch vacancies on mount
  useEffect(() => {
    async function fetchVacancies() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getVacancies();
        setVacancies(data.vacancies);
      } catch (err) {
        console.error('Failed to fetch vacancies:', err);
        setError('Failed to load vacancies. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVacancies();
  }, []);

  // Client-side filtering for search and status
  const filteredVacancies = useMemo(() => {
    return vacancies.filter((vacancy) => {
      const matchesSearch = 
        vacancy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vacancy.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vacancy.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vacancy.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vacancies, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Flex justify="between" align="center">
        <div>
          <Heading size="6" className="text-[var(--text-primary)]">
            Vacancies
          </Heading>
          <Text size="2" className="text-[var(--text-secondary)]">
            Manage your job vacancies and create AI agents
          </Text>
        </div>
        <Button size="2" className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4" />
          Add Vacancy
        </Button>
      </Flex>

      {/* Filters */}
      <Flex gap="3" align="center">
        <div className="flex-1 max-w-sm">
          <TextField.Root 
            placeholder="Search vacancies..." 
            size="2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          >
            <TextField.Slot>
              <Search className="w-4 h-4 text-[var(--text-secondary)]" />
            </TextField.Slot>
          </TextField.Root>
        </div>
        
        <Select.Root value={statusFilter} onValueChange={setStatusFilter}>
          <Select.Trigger placeholder="Filter by status" />
          <Select.Content>
            <Select.Item value="all">All Status</Select.Item>
            <Select.Item value="new">New</Select.Item>
            <Select.Item value="in_progress">In Progress</Select.Item>
            <Select.Item value="agent_created">Agent Created</Select.Item>
          </Select.Content>
        </Select.Root>
      </Flex>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading vacancies...</span>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
          <Button 
            variant="soft" 
            size="2" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <>
          {/* Results count */}
          <Text size="2" className="text-[var(--text-secondary)]">
            Showing {filteredVacancies.length} of {vacancies.length} vacancies
          </Text>

          {/* Vacancy Grid */}
          <VacancyList vacancies={filteredVacancies} />
        </>
      )}
    </div>
  );
}
