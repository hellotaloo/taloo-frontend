'use client';

import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Package,
  Stethoscope,
  GitBranch,
  MoreHorizontal,
  Plus,
  Building2,
  ChevronRight,
  Boxes,
  Heart,
  Phone,
  Forklift,
  SprayCan,
  Briefcase,
  Users,
  FileText,
} from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeaderActionButton } from '@/components/kit/header-action-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// =============================================================================
// MOCK DATA
// =============================================================================

const categoriesData: Record<string, {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  icon: React.ElementType;
  color: string;
  description: string;
  jobFunctions: Array<{
    id: string;
    slug: string;
    name: string;
    icon: React.ElementType;
    documentCount: number;
    vacancyCount: number;
  }>;
  stats: {
    totalJobFunctions: number;
    totalVacancies: number;
    totalDocuments: number;
  };
}> = {
  'transport': {
    id: 'cat-1',
    slug: 'transport',
    name: 'Transport',
    nameEn: 'Transport & Delivery',
    icon: Truck,
    color: 'bg-brand-dark-blue text-white',
    description: 'Functies gerelateerd aan transport, logistiek en bezorging. Inclusief vrachtwagenchauffeurs, koeriers en bezorgers.',
    jobFunctions: [
      { id: '1', slug: 'chauffeur-ce', name: 'Chauffeur CE', icon: Truck, documentCount: 5, vacancyCount: 3 },
      { id: '2', slug: 'chauffeur-c', name: 'Chauffeur C', icon: Truck, documentCount: 4, vacancyCount: 2 },
      { id: '3', slug: 'bezorger', name: 'Bezorger', icon: Package, documentCount: 2, vacancyCount: 5 },
    ],
    stats: {
      totalJobFunctions: 3,
      totalVacancies: 10,
      totalDocuments: 11,
    },
  },
  'logistics': {
    id: 'cat-2',
    slug: 'logistics',
    name: 'Logistics',
    nameEn: 'Warehouse & Logistics',
    icon: Boxes,
    color: 'bg-brand-dark-blue text-white',
    description: 'Magazijn en logistieke functies. Van orderpicking tot voorraadbeheer en heftruckoperaties.',
    jobFunctions: [
      { id: '1', slug: 'magazijnmedewerker', name: 'Magazijnmedewerker', icon: Package, documentCount: 3, vacancyCount: 8 },
      { id: '2', slug: 'heftruckchauffeur', name: 'Heftruckchauffeur', icon: Forklift, documentCount: 4, vacancyCount: 6 },
      { id: '3', slug: 'orderpicker', name: 'Orderpicker', icon: Package, documentCount: 2, vacancyCount: 12 },
      { id: '4', slug: 'warehouse-manager', name: 'Warehouse Manager', icon: Users, documentCount: 3, vacancyCount: 2 },
    ],
    stats: {
      totalJobFunctions: 4,
      totalVacancies: 28,
      totalDocuments: 12,
    },
  },
  'healthcare': {
    id: 'cat-3',
    slug: 'healthcare',
    name: 'Healthcare',
    nameEn: 'Healthcare & Medical',
    icon: Heart,
    color: 'bg-brand-dark-blue text-white',
    description: 'Zorg en medische functies. Verpleegkundigen, verzorgenden en medisch ondersteunend personeel.',
    jobFunctions: [
      { id: '1', slug: 'verpleegkundige', name: 'Verpleegkundige', icon: Stethoscope, documentCount: 4, vacancyCount: 2 },
      { id: '2', slug: 'verzorgende', name: 'Verzorgende', icon: Heart, documentCount: 3, vacancyCount: 5 },
    ],
    stats: {
      totalJobFunctions: 2,
      totalVacancies: 7,
      totalDocuments: 7,
    },
  },
  'office': {
    id: 'cat-4',
    slug: 'office',
    name: 'Office',
    nameEn: 'Office & Administration',
    icon: Building2,
    color: 'bg-brand-dark-blue text-white',
    description: 'Kantoor en administratieve functies. Van callcenter agents tot administratief medewerkers.',
    jobFunctions: [
      { id: '1', slug: 'callcenter-agent', name: 'Callcenter Agent', icon: Phone, documentCount: 1, vacancyCount: 5 },
      { id: '2', slug: 'administratief-medewerker', name: 'Administratief Medewerker', icon: FileText, documentCount: 2, vacancyCount: 3 },
      { id: '3', slug: 'receptionist', name: 'Receptionist', icon: Users, documentCount: 1, vacancyCount: 2 },
    ],
    stats: {
      totalJobFunctions: 3,
      totalVacancies: 10,
      totalDocuments: 4,
    },
  },
  'facility': {
    id: 'cat-5',
    slug: 'facility',
    name: 'Facility',
    nameEn: 'Facility & Cleaning',
    icon: SprayCan,
    color: 'bg-brand-dark-blue text-white',
    description: 'Facilitaire en schoonmaakfuncties. Industrieel schoonmakers en facility managers.',
    jobFunctions: [
      { id: '1', slug: 'schoonmaker', name: 'Schoonmaker', icon: SprayCan, documentCount: 2, vacancyCount: 4 },
      { id: '2', slug: 'facility-manager', name: 'Facility Manager', icon: Building2, documentCount: 3, vacancyCount: 1 },
    ],
    stats: {
      totalJobFunctions: 2,
      totalVacancies: 5,
      totalDocuments: 5,
    },
  },
};

// Fallback for unknown slugs
const defaultCategory = {
  id: '0',
  slug: 'unknown',
  name: 'Onbekende Categorie',
  nameEn: 'Unknown Category',
  icon: Briefcase,
  color: 'bg-brand-dark-blue text-white',
  description: 'Categorie niet gevonden',
  jobFunctions: [],
  stats: {
    totalJobFunctions: 0,
    totalVacancies: 0,
    totalDocuments: 0,
  },
};

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Get category data
  const category = categoriesData[slug] || defaultCategory;
  const Icon = category.icon;

  const handleJobFunctionClick = (jobFunctionSlug: string) => {
    router.push(`/admin/ontology/job-function/${jobFunctionSlug}`);
  };

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/ontology')}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-lg">
              <button
                onClick={() => router.push('/admin/ontology')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Categories
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <h1 className="font-semibold text-gray-900">{category.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderActionButton
              icon={GitBranch}
              onClick={() => router.push('/admin/ontology/graph')}
              data-testid="graph-btn"
            >
              Graph
            </HeaderActionButton>
            <Button variant="outline" size="sm" data-testid="more-options-btn">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </PageLayoutHeader>

      <PageLayoutContent>
        <div className="max-w-5xl">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${category.color}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    Category
                  </Badge>
                  <span className="text-sm text-gray-500">{category.nameEn}</span>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  {category.description}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div
              className="rounded-xl border border-gray-200 bg-white p-5"
              data-testid="stat-job-functions"
              style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Functions</p>
                  <p className="text-2xl font-semibold">{category.stats.totalJobFunctions}</p>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl border border-gray-200 bg-white p-5"
              data-testid="stat-vacancies"
              style={{ animation: 'fade-in-up 0.3s ease-out 50ms backwards' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actieve Vacatures</p>
                  <p className="text-2xl font-semibold">{category.stats.totalVacancies}</p>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl border border-gray-200 bg-white p-5"
              data-testid="stat-documents"
              style={{ animation: 'fade-in-up 0.3s ease-out 100ms backwards' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Document Types</p>
                  <p className="text-2xl font-semibold">{category.stats.totalDocuments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="job-functions" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="job-functions">
                Job Functions
                <Badge variant="secondary" className="ml-2 bg-gray-100">
                  {category.jobFunctions.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="relationships">Relaties</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-medium text-gray-900 mb-4">Category Details</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Naam (NL)</dt>
                    <dd className="text-gray-900">{category.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Naam (EN)</dt>
                    <dd className="text-gray-900">{category.nameEn}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Beschrijving</dt>
                    <dd className="text-gray-900">{category.description}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ID</dt>
                    <dd className="text-gray-500 font-mono text-sm">{category.id}</dd>
                  </div>
                </dl>
              </div>
            </TabsContent>

            {/* Job Functions Tab */}
            <TabsContent value="job-functions" className="mt-6">
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Job Functions in deze categorie</h3>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800"
                    data-testid="add-job-function-btn"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Toevoegen
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Functie</TableHead>
                      <TableHead className="text-right">Documenten</TableHead>
                      <TableHead className="text-right">Vacatures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.jobFunctions.map((func) => {
                      const FuncIcon = func.icon;
                      return (
                        <TableRow
                          key={func.id}
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleJobFunctionClick(func.slug)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#015AD9]/10 flex items-center justify-center">
                                <FuncIcon className="w-4 h-4 text-[#015AD9]" />
                              </div>
                              <span>{func.name}</span>
                              <ChevronRight className="w-4 h-4 text-gray-300" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-gray-500">
                            {func.documentCount}
                          </TableCell>
                          <TableCell className="text-right text-gray-500">
                            {func.vacancyCount}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {category.jobFunctions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    Geen job functions in deze categorie
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="mt-6 space-y-6">
              {/* Relationship Diagram */}
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-medium text-gray-900 mb-4">Relatie Structuur</h3>
                <div className="flex items-center justify-center gap-8 py-8">
                  {/* This Category */}
                  <div className={`px-4 py-3 rounded-xl border-2 ${category.color}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span className="font-semibold">{category.name}</span>
                    </div>
                    <div className="text-xs mt-1 opacity-75">Category</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <span className="text-xs">has</span>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  {/* Job Functions */}
                  <div className="px-4 py-3 rounded-xl border-2 border-[#015AD9] bg-[#015AD9]/5">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#015AD9]" />
                      <span className="font-semibold text-[#015AD9]">Job Functions</span>
                    </div>
                    <div className="text-xs mt-1 text-gray-500">{category.stats.totalJobFunctions} functies</div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center gap-1 text-gray-400">
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <span className="text-xs">require</span>
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  {/* Documents */}
                  <div className="px-4 py-3 rounded-xl border-2 border-orange-300 bg-orange-50">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-orange-700">Documents</span>
                    </div>
                    <div className="text-xs mt-1 text-gray-500">{category.stats.totalDocuments} types</div>
                  </div>
                </div>
              </div>

              {/* Parent/Child Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="font-medium text-gray-900 mb-3">Behoort tot</h4>
                  <div className="text-sm text-gray-500">
                    <Badge variant="outline" className="text-xs">Root Level</Badge>
                    <p className="mt-2">Categories zijn top-level object types in de ontologie.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h4 className="font-medium text-gray-900 mb-3">Bevat</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Job Functions</span>
                      <Badge variant="secondary">{category.stats.totalJobFunctions}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Document Types (indirect)</span>
                      <Badge variant="secondary">{category.stats.totalDocuments}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PageLayoutContent>
    </PageLayout>
  );
}
