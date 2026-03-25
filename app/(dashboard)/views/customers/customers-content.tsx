'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, Archive, List } from 'lucide-react';
import { PageLayout, PageLayoutHeader, PageLayoutContent } from '@/components/layout/page-layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/kit/search-input';
import { CustomersTable } from '@/components/blocks/views';
import type { APIClient } from '@/lib/types';
import { getClients } from '@/lib/api';

export function CustomersContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [subTab, setSubTab] = useState<'active' | 'archived'>('active');

  // Clients state
  const [clients, setClients] = useState<APIClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getClients({ limit: 100 });
      setClients(response.items);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const filteredCustomers = useMemo(() => {
    if (subTab === 'archived') return [];
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.contact_name && c.contact_name.toLowerCase().includes(query)) ||
        (c.contact_email && c.contact_email.toLowerCase().includes(query)) ||
        (c.industry && c.industry.toLowerCase().includes(query)) ||
        (c.location && c.location.toLowerCase().includes(query))
    );
  }, [searchQuery, subTab, clients]);

  return (
    <PageLayout>
      <PageLayoutHeader />
      <PageLayoutContent>
        <div className="flex items-center justify-between gap-4 mb-4">
          <Tabs value={subTab} onValueChange={(v) => setSubTab(v as 'active' | 'archived')}>
            <TabsList variant="line">
              <TabsTrigger value="active">
                <List className="w-3.5 h-3.5" />
                Alle
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                  {loading ? '...' : clients.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="archived">
                <Archive className="w-3.5 h-3.5" />
                Gearchiveerd
                <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-500 text-white">
                  {loading ? '...' : 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Zoeken..."
            className="w-64"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <CustomersTable customers={filteredCustomers} />
        )}
      </PageLayoutContent>
    </PageLayout>
  );
}
