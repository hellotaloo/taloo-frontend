'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeReferenceProps {
  importPath: string;
  filePath: string;
  className?: string;
}

export function CodeReference({
  importPath,
  filePath,
  className = '',
}: CodeReferenceProps) {
  const [copiedImport, setCopiedImport] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  const copyToClipboard = async (text: string, type: 'import' | 'path') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'import') {
        setCopiedImport(true);
        setTimeout(() => setCopiedImport(false), 2000);
      } else {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Extract component name from import path
  const componentName = importPath.split('/').pop() || '';
  const formattedComponentName = componentName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const importStatement = `import { ${formattedComponentName} } from '${importPath}';`;

  return (
    <div className={`bg-gray-50 rounded-lg p-4 font-mono text-xs space-y-3 ${className}`}>
      {/* Import Statement */}
      <div>
        <div className="text-gray-500 mb-1">Import:</div>
        <div className="flex items-start justify-between gap-2">
          <code className="text-blue-600 break-all">{importStatement}</code>
          <button
            onClick={() => copyToClipboard(importStatement, 'import')}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copy import"
          >
            {copiedImport ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* File Path */}
      <div>
        <div className="text-gray-500 mb-1">Location:</div>
        <div className="flex items-start justify-between gap-2">
          <code className="text-gray-700 break-all">{filePath}</code>
          <button
            onClick={() => copyToClipboard(filePath, 'path')}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copy path"
          >
            {copiedPath ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
