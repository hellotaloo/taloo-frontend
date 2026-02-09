'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface NavSection {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

export interface ShowcaseNavProps {
  sections: NavSection[];
  className?: string;
}

function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

function filterSections(sections: NavSection[], query: string): NavSection[] {
  const q = query.trim().toLowerCase();
  if (!q) return sections;

  return sections
    .map((section) => {
      const sectionMatches = matchesQuery(section.title, query) || matchesQuery(section.id, query);
      const subsections = section.subsections?.filter(
        (sub) => matchesQuery(sub.title, query) || matchesQuery(sub.id, query)
      );
      // Include section if it matches or any subsection matches
      if (sectionMatches && !subsections?.length) {
        return { ...section, subsections: undefined };
      }
      if (subsections?.length) {
        return { ...section, subsections };
      }
      if (sectionMatches) {
        return { ...section, subsections: undefined };
      }
      return null;
    })
    .filter((s): s is NavSection => s !== null);
}

export function ShowcaseNav({ sections, className }: ShowcaseNavProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(
    () => filterSections(sections, searchQuery),
    [sections, searchQuery]
  );

  useEffect(() => {
    const source = searchQuery.trim() ? filteredSections : sections;
    const allIds: string[] = [];
    source.forEach((section) => {
      allIds.push(section.id);
      if (section.subsections) {
        section.subsections.forEach((sub) => allIds.push(sub.id));
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    allIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections, searchQuery, filteredSections]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden
        />
        <Input
          type="search"
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-sm"
          aria-label="Search design system components"
        />
      </div>
      <nav
        className={cn(
          'sticky top-6 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        )}
      >
        {filteredSections.length === 0 ? (
          <p className="px-3 py-4 text-sm text-gray-500">
            No components match &quot;{searchQuery}&quot;
          </p>
        ) : (
          filteredSections.map((section) => (
            <div key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleClick(section.id);
                }}
                className={cn(
                  'block px-3 py-2 text-sm rounded-lg transition-colors',
                  activeSection === section.id
                    ? 'bg-brand-blue text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {section.title}
              </a>

              {section.subsections && section.subsections.length > 0 && (
                <div className="ml-3 mt-1 space-y-1">
                  {section.subsections.map((subsection) => (
                    <a
                      key={subsection.id}
                      href={`#${subsection.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleClick(subsection.id);
                      }}
                      className={cn(
                        'block px-3 py-1.5 text-xs rounded-lg transition-colors',
                        activeSection === subsection.id
                          ? 'bg-brand-blue/10 text-brand-blue font-medium'
                          : 'text-gray-500 hover:bg-gray-100'
                      )}
                    >
                      {subsection.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </nav>
    </div>
  );
}
