'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Truck,
  Package,
  Stethoscope,
  GitBranch,
  MoreHorizontal,
  Plus,
  FileText,
  Building2,
  ChevronRight,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// =============================================================================
// MOCK DATA
// =============================================================================

const jobFunctionsData: Record<string, {
  id: string;
  slug: string;
  name: string;
  icon: React.ElementType;
  categorySlug: string;
  categoryName: string;
  categoryColor: string;
  description: string;
  documents: Array<{
    id: string;
    name: string;
    type: 'mandatory' | 'preferred' | 'conditional';
    condition?: string;
    priority: number;
  }>;
  vacancies: Array<{
    id: string;
    title: string;
    company: string;
    status: string;
  }>;
}> = {
  'chauffeur-ce': {
    id: '1',
    slug: 'chauffeur-ce',
    name: 'Chauffeur CE',
    icon: Truck,
    categorySlug: 'transport',
    categoryName: 'Transport',
    categoryColor: 'bg-gray-100 text-gray-600',
    description: 'Vrachtwagenchauffeur met CE-rijbewijs voor nationaal en internationaal transport. Verantwoordelijk voor het veilig vervoeren van goederen en het naleven van rij- en rusttijden.',
    documents: [
      { id: '1', name: 'Identiteitskaart', type: 'mandatory', priority: 1 },
      { id: '2', name: 'Rijbewijs CE', type: 'mandatory', priority: 2 },
      { id: '3', name: 'Code 95', type: 'mandatory', priority: 3 },
      { id: '4', name: 'ADR Certificaat', type: 'conditional', condition: 'Bij gevaarlijk transport', priority: 4 },
      { id: '5', name: 'Medisch Attest', type: 'preferred', priority: 5 },
    ],
    vacancies: [
      { id: '1', title: 'CE Chauffeur Nationaal', company: 'ASAP Solutions', status: 'open' },
      { id: '2', title: 'Internationaal Chauffeur', company: 'Transport BV', status: 'open' },
      { id: '3', title: 'Nachtchauffeur CE', company: 'LogiCorp', status: 'on_hold' },
    ],
  },
  'magazijnmedewerker': {
    id: '2',
    slug: 'magazijnmedewerker',
    name: 'Magazijnmedewerker',
    icon: Package,
    categorySlug: 'logistics',
    categoryName: 'Logistics',
    categoryColor: 'bg-gray-100 text-gray-600',
    description: 'Orderpicker en magazijnmedewerker verantwoordelijk voor het picken, packen en verzenden van orders.',
    documents: [
      { id: '1', name: 'Identiteitskaart', type: 'mandatory', priority: 1 },
      { id: '2', name: 'VCA Certificaat', type: 'mandatory', priority: 2 },
      { id: '3', name: 'Heftruckcertificaat', type: 'conditional', condition: 'Bij heftruckwerk', priority: 3 },
    ],
    vacancies: [
      { id: '1', title: 'Orderpicker', company: 'Warehouse Plus', status: 'open' },
      { id: '2', title: 'Magazijnmedewerker Nacht', company: 'LogiCorp', status: 'open' },
    ],
  },
  'verpleegkundige': {
    id: '3',
    slug: 'verpleegkundige',
    name: 'Verpleegkundige',
    icon: Stethoscope,
    categorySlug: 'healthcare',
    categoryName: 'Healthcare',
    categoryColor: 'bg-gray-100 text-gray-600',
    description: 'Gediplomeerd verpleegkundige voor ziekenhuizen, verzorgingstehuizen en thuiszorg.',
    documents: [
      { id: '1', name: 'Identiteitskaart', type: 'mandatory', priority: 1 },
      { id: '2', name: 'Diploma Verpleegkunde', type: 'mandatory', priority: 2 },
      { id: '3', name: 'RIZIV Nummer', type: 'mandatory', priority: 3 },
      { id: '4', name: 'Uittreksel Strafregister', type: 'mandatory', priority: 4 },
    ],
    vacancies: [
      { id: '1', title: 'Verpleegkundige Spoedafdeling', company: 'UZ Gent', status: 'open' },
      { id: '2', title: 'Thuisverpleegkundige', company: 'Thuiszorg Vlaanderen', status: 'open' },
    ],
  },
};

// Fallback for unknown slugs
const defaultJobFunction = {
  id: '0',
  slug: 'unknown',
  name: 'Onbekende Functie',
  icon: Truck,
  categorySlug: 'unknown',
  categoryName: 'Unknown',
  categoryColor: 'bg-gray-100 text-gray-600',
  description: 'Functie niet gevonden',
  documents: [],
  vacancies: [],
};

// =============================================================================
// INSPECTOR PANEL
// =============================================================================

interface InspectorPanelProps {
  document: {
    id: string;
    name: string;
    type: 'mandatory' | 'preferred' | 'conditional';
    condition?: string;
    priority: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InspectorPanel({ document, open, onOpenChange }: InspectorPanelProps) {
  const [type, setType] = useState(document?.type || 'mandatory');
  const [condition, setCondition] = useState(document?.condition || '');
  const [priority, setPriority] = useState(document?.priority?.toString() || '1');

  // Update state when document changes
  useState(() => {
    if (document) {
      setType(document.type);
      setCondition(document.condition || '');
      setPriority(document.priority.toString());
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[450px] flex flex-col h-full">
        {/* Fixed Header */}
        <SheetHeader className="shrink-0 border-b pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-dark-blue flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            {document?.name || 'Document'}
          </SheetTitle>
          <SheetDescription>
            Bewerk de vereisten voor dit document
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Algemeen</TabsTrigger>
              <TabsTrigger value="display">Weergave</TabsTrigger>
              <TabsTrigger value="advanced">Geavanceerd</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="mt-4 space-y-4">
              {/* Requirement Type */}
              <div className="space-y-2">
                <Label>Vereiste Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        Verplicht
                      </span>
                    </SelectItem>
                    <SelectItem value="preferred">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        Gewenst
                      </span>
                    </SelectItem>
                    <SelectItem value="conditional">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        Voorwaardelijk
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Condition (only for conditional) */}
              {type === 'conditional' && (
                <div className="space-y-2">
                  <Label>Voorwaarde</Label>
                  <Input
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    placeholder="Bijv. Bij gevaarlijk transport"
                  />
                  <p className="text-xs text-gray-500">
                    Beschrijf wanneer dit document vereist is
                  </p>
                </div>
              )}

              {/* Priority */}
              <div className="space-y-2">
                <Label>Prioriteit</Label>
                <Input
                  type="number"
                  min="1"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Volgorde waarin documenten worden opgevraagd
                </p>
              </div>
            </TabsContent>

            <TabsContent value="display" className="mt-4 space-y-4">
              <p className="text-sm text-gray-500">
                Weergave-instellingen komen binnenkort.
              </p>
            </TabsContent>

            <TabsContent value="advanced" className="mt-4 space-y-4">
              <p className="text-sm text-gray-500">
                Geavanceerde instellingen komen binnenkort.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Fixed Footer */}
        <SheetFooter className="shrink-0 border-t flex-row justify-between">
          <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
            Verwijderen
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button className="bg-gray-900 hover:bg-gray-800">
              Opslaan
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function JobFunctionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [selectedDocument, setSelectedDocument] = useState<typeof jobFunctionsData['chauffeur-ce']['documents'][0] | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Get job function data
  const jobFunction = jobFunctionsData[slug] || defaultJobFunction;
  const Icon = jobFunction.icon;

  const handleDocumentClick = (doc: typeof jobFunction.documents[0]) => {
    setSelectedDocument(doc);
    setInspectorOpen(true);
  };

  const handleCategoryClick = () => {
    router.push(`/admin/ontology/category/${jobFunction.categorySlug}`);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mandatory':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'preferred':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'conditional':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'mandatory':
        return 'Verplicht';
      case 'preferred':
        return 'Gewenst';
      case 'conditional':
        return 'Voorwaardelijk';
      default:
        return type;
    }
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
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Job Functions
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <h1 className="font-semibold text-gray-900">{jobFunction.name}</h1>
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
              <div className="w-14 h-14 rounded-xl bg-brand-dark-blue flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{jobFunction.name}</h2>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    Job Function
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${jobFunction.categoryColor} hover:opacity-80 cursor-pointer`}
                    onClick={handleCategoryClick}
                  >
                    {jobFunction.categoryName}
                  </Badge>
                </div>
                <p className="text-gray-600 max-w-2xl">
                  {jobFunction.description}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="documents" className="w-full">
            <TabsList>
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="documents">
                Documenten
                <Badge variant="secondary" className="ml-2 bg-gray-100">
                  {jobFunction.documents.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="requirements">Vereisten</TabsTrigger>
              <TabsTrigger value="relationships">Relaties</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="rounded-xl border border-gray-200 bg-white p-5"
                  data-testid="stat-documents"
                  style={{ animation: 'fade-in-up 0.3s ease-out 0ms backwards' }}
                >
                  <p className="text-sm text-gray-500 mb-1">Documenten</p>
                  <p className="text-2xl font-semibold">{jobFunction.documents.length}</p>
                </div>
                <div
                  className="rounded-xl border border-gray-200 bg-white p-5"
                  data-testid="stat-vacancies"
                  style={{ animation: 'fade-in-up 0.3s ease-out 50ms backwards' }}
                >
                  <p className="text-sm text-gray-500 mb-1">Vacatures</p>
                  <p className="text-2xl font-semibold">{jobFunction.vacancies.length}</p>
                </div>
                <div
                  className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 cursor-pointer transition-colors"
                  data-testid="stat-category"
                  onClick={handleCategoryClick}
                  style={{ animation: 'fade-in-up 0.3s ease-out 100ms backwards' }}
                >
                  <p className="text-sm text-gray-500 mb-1">Categorie</p>
                  <p className="text-2xl font-semibold">{jobFunction.categoryName}</p>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="mt-6">
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">Vereiste Documenten</h3>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800"
                    data-testid="add-document-btn"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Toevoegen
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Voorwaarde</TableHead>
                      <TableHead className="text-right">Prioriteit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobFunction.documents.map((doc) => (
                      <TableRow
                        key={doc.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleDocumentClick(doc)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            {doc.name}
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTypeColor(doc.type)}`}
                          >
                            {getTypeName(doc.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {doc.condition || '-'}
                        </TableCell>
                        <TableCell className="text-right text-gray-500">
                          {doc.priority}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Requirements Tab */}
            <TabsContent value="requirements" className="mt-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <p className="text-gray-500">
                  Vereisten configuratie komt binnenkort.
                </p>
              </div>
            </TabsContent>

            {/* Relationships Tab */}
            <TabsContent value="relationships" className="mt-6 space-y-6">
              {/* Used by Vacancies */}
              <div className="rounded-xl border border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900">
                    Gebruikt door Vacatures ({jobFunction.vacancies.length})
                  </h3>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jobFunction.vacancies.map((vacancy, index) => (
                      <div
                        key={vacancy.id}
                        data-testid={`vacancy-card-${vacancy.id}`}
                        className="rounded-lg border border-gray-200 p-4 hover:border-gray-300 cursor-pointer transition-colors"
                        style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms backwards` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {vacancy.title}
                            </p>
                            <p className="text-xs text-gray-500">{vacancy.company}</p>
                            <Badge
                              variant="secondary"
                              className={`mt-2 text-xs ${
                                vacancy.status === 'open'
                                  ? 'bg-green-50 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {vacancy.status === 'open' ? 'Open' : 'On Hold'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Inspector Panel */}
        <InspectorPanel
          document={selectedDocument}
          open={inspectorOpen}
          onOpenChange={setInspectorOpen}
        />
      </PageLayoutContent>
    </PageLayout>
  );
}
