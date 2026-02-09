import React from 'react';
import { CodeReference } from './code-reference';

export interface ComponentExampleProps {
  name: string;
  description?: string;
  importPath: string;
  filePath: string;
  children: React.ReactNode;
  className?: string;
}

export function ComponentExample({
  name,
  description,
  importPath,
  filePath,
  children,
  className = '',
}: ComponentExampleProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Visual Example */}
      <div className="rounded-lg border border-gray-200 p-6 bg-white">
        {children}
      </div>

      {/* Code Reference */}
      <CodeReference importPath={importPath} filePath={filePath} />
    </div>
  );
}
