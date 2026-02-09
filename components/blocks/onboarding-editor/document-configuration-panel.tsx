'use client';

import { FileText, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { BoltIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Timeline, TimelineNode, SortableCard, SortableCardAction } from '@/components/kit/timeline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export interface DocumentConfig {
  id: string;
  type: 'id_card' | 'drivers_license' | 'sis_card' | 'bank_card' | 'custom';
  displayName: string;
  required: boolean;
  verificationMethod: 'auto' | 'manual' | 'none';
  position: number;
  instructions?: string;
  enabled?: boolean;
}

interface DocumentConfigurationPanelProps {
  documents: DocumentConfig[];
  readOnly?: boolean;
  onToggleDocument?: (documentId: string, enabled: boolean) => void;
  onReorder?: (documents: DocumentConfig[]) => void;
  onEditDocument?: (document: DocumentConfig) => void;
  onDeleteDocument?: (documentId: string) => void;
}

export function DocumentConfigurationPanel({
  documents,
  readOnly = false,
  onToggleDocument,
  onReorder,
  onEditDocument,
  onDeleteDocument,
}: DocumentConfigurationPanelProps) {
  // Sort documents by position
  const sortedDocuments = [...documents].sort((a, b) => a.position - b.position);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedDocuments.findIndex((d) => d.id === active.id);
      const newIndex = sortedDocuments.findIndex((d) => d.id === over.id);

      const reordered = arrayMove(sortedDocuments, oldIndex, newIndex);
      // Update positions
      const withUpdatedPositions = reordered.map((doc, index) => ({
        ...doc,
        position: index + 1,
      }));

      onReorder?.(withUpdatedPositions);
    }
  };

  // Calculate animation delays
  const triggerDelay = 0;
  const lookupAtsDelay = 80;
  const lookupWorkIdDelay = 160;
  const documentsBaseDelay = 240;
  const outcomeDelay = documentsBaseDelay + sortedDocuments.length * 60 + 80;
  const atsDelay = outcomeDelay + 80;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="max-w-3xl mx-auto">
        <Timeline>
          {/* Trigger */}
          <TimelineNode animationDelay={triggerDelay}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-lime-green">
              <BoltIcon className="w-3.5 h-3.5 text-black" />
              <span className="text-xs font-medium text-black">Nieuwe medewerker</span>
            </div>
          </TimelineNode>

          {/* Lookup candidate in ATS */}
          <TimelineNode animationDelay={lookupAtsDelay}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full bg-white">
              <Image
                src="/salesforc-logo-cloud.png"
                alt="Salesforce"
                width={14}
                height={14}
                className="object-contain"
              />
              <span className="text-xs font-medium text-gray-600">Lookup candidate in ATS</span>
            </div>
          </TimelineNode>

          {/* Lookup candidate WorkID */}
          <TimelineNode animationDelay={lookupWorkIdDelay}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full bg-white">
              <Image
                src="/vendors/work_id.png"
                alt="WorkID"
                width={14}
                height={14}
                className="object-contain"
              />
              <span className="text-xs font-medium text-gray-600">Lookup candidate in WorkID</span>
            </div>
          </TimelineNode>

          {/* Document Cards */}
          <TimelineNode animationDelay={documentsBaseDelay} alignDot="top">
            <h4 className="text-xs font-normal text-black uppercase tracking-wide mb-2">
              Benodigde documenten
            </h4>
            <DndContext
              sensors={readOnly ? [] : sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedDocuments.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedDocuments.map((doc, index) => {
                    const actions: SortableCardAction[] = [];

                    if (onEditDocument) {
                      actions.push({
                        icon: Pencil,
                        label: 'Bewerken',
                        onClick: () => onEditDocument(doc),
                      });
                    }

                    if (onDeleteDocument) {
                      actions.push({
                        icon: Trash2,
                        label: 'Verwijderen',
                        onClick: () => onDeleteDocument(doc.id),
                        variant: 'danger',
                      });
                    }

                    return (
                      <SortableCard
                        key={doc.id}
                        id={doc.id}
                        animationDelay={documentsBaseDelay + 60 + index * 60}
                        actions={actions}
                        readOnly={readOnly}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-600 shrink-0" />
                            <span className="text-sm text-gray-900">{doc.displayName}</span>
                            {doc.required ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                                Verplicht
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Optioneel
                              </span>
                            )}
                          </div>
                        </div>
                        {!readOnly && (
                          <Switch
                            checked={doc.enabled ?? true}
                            onCheckedChange={(checked) => onToggleDocument?.(doc.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </SortableCard>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </TimelineNode>

          {/* Outcome */}
          <TimelineNode animationDelay={outcomeDelay}>
            <div className="bg-brand-dark-blue rounded-lg p-3 flex items-center gap-2">
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-dark-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Notificeer de recruiter</p>

              </div>
            </div>
          </TimelineNode>

          {/* ATS Integration */}
          <TimelineNode animationDelay={atsDelay} isLast>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-full bg-white">
              <Image
                src="/salesforc-logo-cloud.png"
                alt="Salesforce"
                width={14}
                height={14}
                className="object-contain"
              />
              <span className="text-xs font-medium text-gray-600">Update ATS</span>
            </div>
          </TimelineNode>
        </Timeline>
      </div>
    </div>
  );
}
