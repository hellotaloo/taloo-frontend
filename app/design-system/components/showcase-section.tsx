import React from 'react';

export interface ShowcaseSectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ShowcaseSection({
  id,
  title,
  description,
  children,
  className = '',
}: ShowcaseSectionProps) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h2>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}
