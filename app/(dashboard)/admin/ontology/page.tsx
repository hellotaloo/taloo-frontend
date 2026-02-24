'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  ExternalLink,
  Landmark,
  Plus,
  Settings,
} from 'lucide-react';
import {
  PageLayout,
  PageLayoutHeader,
  PageLayoutContent,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeaderActionButton } from '@/components/kit/header-action-button';
import { ObjectTypeCard } from '@/components/kit/object-type-card';
import { OntologySidebar } from '@/components/blocks/ontology-sidebar';
import { JobFunctionCard, CreateEntityDialog, EntityDetailView } from '@/components/blocks/ontology';
import { getOntologyOverview, getOntologyEntities, getOntologyRelations } from '@/lib/ontology-api';
import { getLucideIcon } from '@/lib/ontology-utils';
import { getEntityTabs, getDefaultTab } from '@/lib/ontology-tab-config';
import type { OntologyType, OntologyEntity, OntologyRelation, OntologyEntityDetail, OntologyNavigationEntry } from '@/lib/types';
import { toast } from 'sonner';

export default function OntologyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL params
  const sectionParam = searchParams.get('section');
  const entityParam = searchParams.get('entity');
  const tabParam = searchParams.get('tab');

  const [activeSection, setActiveSection] = useState(sectionParam || 'discover');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync activeSection when navigating back with ?section= param
  useEffect(() => {
    if (sectionParam) setActiveSection(sectionParam);
  }, [sectionParam]);

  // API state
  const [types, setTypes] = useState<OntologyType[]>([]);
  const [jobFunctions, setJobFunctions] = useState<OntologyEntity[]>([]);
  const [documentTypes, setDocumentTypes] = useState<OntologyEntity[]>([]);
  const [belongsToRelations, setBelongsToRelations] = useState<OntologyRelation[]>([]);
  const [requiresRelations, setRequiresRelations] = useState<OntologyRelation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Type-filtered entity list state
  const [typeEntities, setTypeEntities] = useState<OntologyEntity[]>([]);
  const [typeEntitiesLoading, setTypeEntitiesLoading] = useState(false);

  // Entity detail state
  const [entityDetail, setEntityDetail] = useState<OntologyEntityDetail | null>(null);

  // Navigation stack for breadcrumb trail (entity-to-entity)
  const [navigationStack, setNavigationStack] = useState<OntologyNavigationEntry[]>([]);
  // Original browse section slug — captured once when entering entity mode
  const [rootSectionSlug, setRootSectionSlug] = useState<string | null>(null);

  // Check if activeSection is a known type slug
  const fixedSections = ['discover', 'history', 'settings'];
  const activeType = types.find((t) => t.slug === activeSection);
  const isTypeView = !fixedSections.includes(activeSection);

  useEffect(() => {
    async function load() {
      try {
        const [overview, jfData, docData, belongsTo, requires] = await Promise.all([
          getOntologyOverview(),
          getOntologyEntities({ type: 'job_function', limit: 20 }),
          getOntologyEntities({ type: 'document_type', limit: 100 }),
          getOntologyRelations({ type: 'belongs_to' }),
          getOntologyRelations({ type: 'requires' }),
        ]);
        setTypes(overview.types);
        setJobFunctions(jfData.items);
        setDocumentTypes(docData.items);
        setBelongsToRelations(belongsTo);
        setRequiresRelations(requires);
      } catch {
        toast.error('Kon ontology niet laden');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fetch entities when a specific type is selected (only in browse mode)
  useEffect(() => {
    if (!activeType || entityParam) {
      if (!entityParam) setTypeEntities([]);
      return;
    }
    let cancelled = false;
    setTypeEntitiesLoading(true);
    getOntologyEntities({ type: activeType.slug, limit: 100 })
      .then((data) => {
        if (!cancelled) setTypeEntities(data.items);
      })
      .catch(() => {
        if (!cancelled) toast.error('Kon entities niet laden');
      })
      .finally(() => {
        if (!cancelled) setTypeEntitiesLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeType, entityParam]);

  // Clear entity detail and nav stack when leaving entity view
  useEffect(() => {
    if (!entityParam) {
      setEntityDetail(null);
      setNavigationStack([]);
      setRootSectionSlug(null);
    }
  }, [entityParam]);

  // =========================================================================
  // URL helpers
  // =========================================================================

  const buildUrl = useCallback(
    (params: { section?: string; entity?: string | null; tab?: string | null }) => {
      const url = new URLSearchParams();
      const section = params.section ?? activeSection;
      if (section && section !== 'discover') url.set('section', section);
      if (params.entity !== undefined) {
        if (params.entity) {
          url.set('entity', params.entity);
          if (params.tab) url.set('tab', params.tab);
        }
      } else if (entityParam) {
        url.set('entity', entityParam);
        const tab = params.tab ?? tabParam;
        if (tab) url.set('tab', tab);
      }
      const qs = url.toString();
      return `/admin/ontology${qs ? `?${qs}` : ''}`;
    },
    [activeSection, entityParam, tabParam],
  );

  const handleEntityClick = useCallback(
    (entityId: string) => {
      if (entityParam && entityDetail) {
        // Entity-to-entity navigation: push current entity onto the nav stack
        setNavigationStack((prev) => [
          ...prev,
          { id: entityDetail.id, name: entityDetail.name, typeSlug: entityDetail.type_slug },
        ]);
      } else {
        // Entering entity mode from browse: capture the original section
        setRootSectionSlug(activeSection);
      }
      const section = activeType?.slug || activeSection;
      router.push(buildUrl({ section, entity: entityId, tab: null }));
    },
    [activeType, activeSection, buildUrl, router, entityParam, entityDetail],
  );

  const handleEntityBack = useCallback(() => {
    if (navigationStack.length > 0) {
      // Pop the last entry from the stack and navigate to it
      const newStack = [...navigationStack];
      const previous = newStack.pop()!;
      setNavigationStack(newStack);
      setEntityDetail(null);
      router.push(buildUrl({ section: previous.typeSlug, entity: previous.id, tab: null }));
    } else {
      // Stack empty — go back to browse mode (use original section)
      setEntityDetail(null);
      router.push(buildUrl({ section: rootSectionSlug || activeSection, entity: null, tab: null }));
    }
  }, [buildUrl, router, navigationStack, rootSectionSlug, activeSection]);

  const handleBreadcrumbJump = useCallback(
    (index: number) => {
      if (index < 0) {
        // Jump to root (browse mode, use original section)
        setNavigationStack([]);
        setEntityDetail(null);
        router.push(buildUrl({ section: rootSectionSlug || activeSection, entity: null, tab: null }));
        return;
      }
      // Navigate to the entry at `index`, keep everything before it
      const entry = navigationStack[index];
      setNavigationStack(navigationStack.slice(0, index));
      setEntityDetail(null);
      router.push(buildUrl({ section: entry.typeSlug, entity: entry.id, tab: null }));
    },
    [navigationStack, buildUrl, router, rootSectionSlug, activeSection],
  );

  const handleEntityTabChange = useCallback(
    (tabId: string) => {
      router.replace(buildUrl({ tab: tabId }), { scroll: false });
    },
    [buildUrl, router],
  );

  const handleEntityLoaded = useCallback((entity: OntologyEntityDetail) => {
    setEntityDetail(entity);
    // Update activeSection to match the entity's type if it differs (entity-to-entity navigation)
    if (entity.type_slug !== activeSection) {
      setActiveSection(entity.type_slug);
    }
  }, [activeSection]);

  const handleGraphClick = () => {
    router.push('/admin/ontology/graph');
  };

  // =========================================================================
  // Data enrichment for discover view
  // =========================================================================

  const categoryMap = new Map(
    belongsToRelations.map((r) => [
      r.source_entity_id,
      { id: r.target_entity_id, name: r.target_entity_name },
    ]),
  );

  const docCountMap = new Map<string, number>();
  requiresRelations.forEach((r) => {
    docCountMap.set(r.source_entity_id, (docCountMap.get(r.source_entity_id) || 0) + 1);
  });

  const documentsByCategory = new Map<string, { name: string; documents: string[] }>();
  documentTypes.forEach((doc) => {
    const relation = belongsToRelations.find((r) => r.source_entity_id === doc.id);
    const categoryName = relation?.target_entity_name ?? 'Overig';
    const existing = documentsByCategory.get(categoryName);
    if (existing) {
      existing.documents.push(doc.name);
    } else {
      documentsByCategory.set(categoryName, { name: categoryName, documents: [doc.name] });
    }
  });

  const filteredJobFunctions = jobFunctions.filter(
    (func) =>
      func.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (func.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (categoryMap.get(func.id)?.name || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredTypeEntities = typeEntities.filter(
    (entity) =>
      entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entity.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // =========================================================================
  // Sidebar configuration
  // =========================================================================

  const sidebarTabs = useMemo(() => {
    if (!entityParam || !entityDetail) return undefined;
    const tabDefs = getEntityTabs(entityDetail.type_slug);
    return tabDefs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      icon: tab.icon,
      count: tab.getCount ? tab.getCount(entityDetail) : undefined,
      dividerBefore: tab.dividerBefore,
    }));
  }, [entityParam, entityDetail]);

  const effectiveEntityTab =
    tabParam || (entityDetail ? getDefaultTab(entityDetail.type_slug) : 'overview');

  const entityTypeName = useMemo(() => {
    // Use the original browse section (stable root), not the current entity's type
    const typeSlug = rootSectionSlug || activeSection;
    const type = types.find((t) => t.slug === typeSlug);
    return type?.name_plural || type?.name || typeSlug;
  }, [rootSectionSlug, activeSection, types]);

  const sidebar = entityParam ? (
    <OntologySidebar
      mode="entity"
      entityName={entityDetail?.name}
      entityTypeName={entityTypeName}
      onBack={handleEntityBack}
      navigationStack={navigationStack}
      onBreadcrumbJump={handleBreadcrumbJump}
      entityTabs={sidebarTabs}
      activeEntityTab={effectiveEntityTab}
      onEntityTabChange={handleEntityTabChange}
      onAddEntity={() => setCreateDialogOpen(true)}
      // Required browse props (not used in entity mode)
      activeSection={activeSection}
      onSectionChange={() => {}}
      searchQuery=""
      onSearchChange={() => {}}
    />
  ) : (
    <OntologySidebar
      mode="browse"
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      entityTypes={types}
      onCreateEntity={() => setCreateDialogOpen(true)}
      onGraphClick={handleGraphClick}
    />
  );

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <PageLayout>
      <PageLayoutHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold text-gray-900">Ontology</h1>
          </div>
          <div className="flex items-center gap-2">
            <HeaderActionButton
              icon={Settings}
              onClick={() => setActiveSection('settings')}
              data-testid="settings-btn"
            >
              Configuratie
            </HeaderActionButton>
          </div>
        </div>
      </PageLayoutHeader>
      <PageLayoutContent
        sidebar={sidebar}
        sidebarPosition="left"
        sidebarWidth={240}
        sidebarClassName="bg-gray-50/50"
      >
        {entityParam ? (
          /* ============================================= */
          /* ENTITY DETAIL VIEW                            */
          /* ============================================= */
          <EntityDetailView
            entityId={entityParam}
            types={types}
            activeTab={effectiveEntityTab}
            onTabChange={handleEntityTabChange}
            onEntityClick={handleEntityClick}
            onEntityLoaded={handleEntityLoaded}
          />
        ) : isTypeView ? (
          /* ============================================= */
          /* TYPE-FILTERED ENTITY LIST VIEW                */
          /* ============================================= */
          <div className="max-w-5xl space-y-6">
            {activeType && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {activeType.name_plural || activeType.name}
                  </h2>
                  <Badge variant="secondary" className="bg-gray-100">
                    {activeType.entity_count} items
                  </Badge>
                </div>
                <Button
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="add-entity-type-btn"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nieuw
                </Button>
              </div>
            )}

            {typeEntitiesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTypeEntities.map((entity, index) => {
                    const Icon = getLucideIcon(entity.icon);
                    return (
                      <div
                        key={entity.id}
                        onClick={() => handleEntityClick(entity.id)}
                        data-testid={`entity-card-${entity.id}`}
                        className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                        style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms backwards` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-dark-blue flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">{entity.name}</h3>
                            {entity.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">{entity.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredTypeEntities.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {searchQuery
                      ? `Geen resultaten voor "${searchQuery}"`
                      : `Nog geen ${(activeType?.name_plural || activeType?.name || activeSection).toLowerCase()} aangemaakt`}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ============================================= */
          /* DISCOVER OVERVIEW                             */
          /* ============================================= */
          <div className="max-w-5xl space-y-8">
            {/* Intro Banner */}
            <div className="rounded-2xl bg-brand-dark-blue p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-brand-lime-green" />
                  <span className="text-xs font-medium text-brand-lime-green uppercase tracking-wide">
                    Wat is Ontology?
                  </span>
                </div>
                <h2 className="text-2xl font-serif text-white max-w-lg">
                  Het fundament waarop je agents bouwen
                </h2>
                <p className="text-sm text-brand-light-blue max-w-xl">
                  Verbind je organisatiekennis — functies, documenten, vereisten — met je agents.
                  Zo krijgen ze context en guardrails, opereren ze binnen jouw mentale model,
                  en vormt het de brug naar gestructureerde data met je bestaande tools en systemen.
                </p>
                <p className="text-xs text-brand-light-blue/70 max-w-xl pt-1">
                  Je hoeft niet alles vanaf dag een te definieren. De ontology groeit mee
                  terwijl je schaalt — agents detecteren wat ontbreekt en stellen updates voor.
                </p>
              </div>
            </div>

            {/* Object Types Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Object Types</h2>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {types.map((type, index) => (
                    <ObjectTypeCard
                      key={type.id}
                      id={type.slug}
                      name={type.name_plural || type.name}
                      nameEn={type.name}
                      count={type.entity_count}
                      icon={getLucideIcon(type.icon)}
                      color="bg-brand-dark-blue text-white"
                      description={type.description || ''}
                      comingSoon={type.slug === 'skill'}
                      onClick={() => setActiveSection(type.slug)}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Job Functions Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Job Functions
                  {searchQuery && (
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({filteredJobFunctions.length} resultaten)
                    </span>
                  )}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setActiveSection('job_function')}
                >
                  Bekijk alles
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                          <div className="h-5 bg-gray-100 rounded w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobFunctions.map((func, index) => {
                    const category = categoryMap.get(func.id);
                    return (
                      <JobFunctionCard
                        key={func.id}
                        id={func.id}
                        slug={func.id}
                        name={func.name}
                        icon={getLucideIcon(func.icon)}
                        documentCount={docCountMap.get(func.id) || 0}
                        vacancyCount={0}
                        categorySlug={category?.id || ''}
                        categoryName={category?.name || ''}
                        categoryColor="bg-gray-100 text-gray-600"
                        description={func.description || ''}
                        onClick={() => handleEntityClick(func.id)}
                        onCategoryClick={(id) => handleEntityClick(id)}
                        animationDelay={250 + index * 50}
                      />
                    );
                  })}
                </div>
              )}
              {!loading && filteredJobFunctions.length === 0 && searchQuery && (
                <div className="text-center py-8 text-gray-500">
                  Geen functies gevonden voor &quot;{searchQuery}&quot;
                </div>
              )}
            </section>

            {/* Document Types by Category */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Documenten per Categorie
                </h2>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from(documentsByCategory.values()).map((cat, index) => (
                    <div
                      key={cat.name}
                      data-testid={`document-category-card-${cat.name.toLowerCase()}`}
                      className="rounded-xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors cursor-pointer"
                      style={{ animation: `fade-in-up 0.3s ease-out ${550 + index * 50}ms backwards` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{cat.name}</h3>
                        <Badge variant="secondary" className="bg-gray-100">
                          {cat.documents.length}
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {cat.documents.map((doc) => (
                          <li
                            key={doc}
                            className="text-sm text-gray-600 flex items-center gap-2"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Info Banner */}
            <section className="rounded-2xl bg-brand-dark-blue p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-lime-green flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5 text-brand-dark-blue" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-brand-lime-green uppercase tracking-wide">
                      Binnenkort
                    </span>
                  </div>
                  <h3 className="font-semibold text-white mb-2 text-lg">
                    ESCO Skills Integratie
                  </h3>
                  <p className="text-sm text-brand-light-blue mb-4 max-w-xl">
                    Koppel vaardigheden aan de Europese ESCO taxonomie
                    voor gestandaardiseerde skill matching en betere candidate-vacancy
                    matching.
                  </p>
                  <Button className="bg-brand-lime-green hover:bg-brand-lime-green/90 text-brand-dark-blue font-medium">
                    Meer informatie
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </PageLayoutContent>

      <CreateEntityDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultTypeSlug={activeType?.slug}
        onCreated={(entityId) => {
          handleEntityClick(entityId);
        }}
      />
    </PageLayout>
  );
}
