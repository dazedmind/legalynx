'use client';

import React, { useState } from 'react';

interface Citation {
  number: string;
  source: string;
}

interface CitationRendererProps {
  content: string;
}

/**
 * Parses content with citations in the format:
 * - Inline: ^[1], ^[2], etc.
 * - Sources section: ## Sources\n^[1] Page 15, Section 8.2\n^[2] Page 7
 *
 * Returns formatted HTML with hover tooltips for citations.
 */
export function CitationRenderer({ content }: CitationRendererProps) {
  const [hoveredCitation, setHoveredCitation] = useState<{ num: string; element: HTMLElement } | null>(null);

  // Extract sources section and main content
  const sourcesMatch = content.match(/## Sources\s*([\s\S]*?)$/);
  const mainContent = sourcesMatch ? content.substring(0, sourcesMatch.index).trim() : content;
  const sourcesText = sourcesMatch ? sourcesMatch[1].trim() : '';

  // Parse citations from sources section
  const citations: Map<string, Citation> = new Map();
  if (sourcesText) {
    const citationLines = sourcesText.split('\n');
    citationLines.forEach(line => {
      const match = line.match(/\^\[(\d+)\]\s*(.+)/);
      if (match) {
        citations.set(match[1], {
          number: match[1],
          source: match[2].trim()
        });
      }
    });
  }

  // Process content to replace citations with interactive superscripts
  const renderContentWithCitations = () => {
    let processedContent = mainContent;
    let citationIndex = 0;

    // Replace markdown formatting - order matters!
    // 1. Bold (** **) must be processed before italic (* *)
    processedContent = processedContent
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')  // Bold
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')  // Italic (after bold is done)
      .replace(/_([^_]+)_/g, '<u>$1</u>')  // Underline
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>');  // Code

    // Replace citations with superscript spans - each gets a unique ID
    processedContent = processedContent.replace(
      /\^\[(\d+)\]/g,
      (match, citationNum) => {
        const citation = citations.get(citationNum);
        if (!citation) return match;

        const uniqueId = `citation-${citationNum}-${citationIndex++}`;
        return `<sup class="citation-marker" id="${uniqueId}" data-citation="${citationNum}" data-source="${citation.source}">[${citationNum}]</sup>`;
      }
    );

    return processedContent;
  };

  const handleCitationHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('citation-marker')) {
      const citationNum = target.getAttribute('data-citation');
      if (citationNum) {
        setHoveredCitation({ num: citationNum, element: target });
      }
    } else {
      setHoveredCitation(null);
    }
  };

  const getTooltipPosition = () => {
    if (!hoveredCitation) return { top: 0, left: 0 };

    const rect = hoveredCitation.element.getBoundingClientRect();
    return {
      top: rect.top - 10,
      left: rect.left + rect.width / 2
    };
  };

  return (
    <div className="relative" onMouseOver={handleCitationHover} onMouseOut={() => setHoveredCitation(null)}>
      {/* Main content with citations */}
      <div
        dangerouslySetInnerHTML={{ __html: renderContentWithCitations() }}
        className="whitespace-pre-wrap break-words"
      />

      {/* Citation tooltips */}
      {hoveredCitation && citations.has(hoveredCitation.num) && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2"
          style={{
            ...getTooltipPosition(),
            maxWidth: '250px'
          }}
        >
          <div className="font-medium mb-1">Source {hoveredCitation.num}:</div>
          <div>{citations.get(hoveredCitation.num)?.source}</div>
          {/* Tooltip arrow */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
        </div>
      )}

      {/* Sources section - hidden but accessible for copying */}
      {citations.size > 0 && (
        <div className="mt-6 pt-4 border-t border-tertiary">
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground transition-colors font-medium mb-2">
              View Sources ({citations.size})
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              {Array.from(citations.values()).map(citation => (
                <div key={citation.number} className="flex gap-2">
                  <span className="font-mono text-xs">[{citation.number}]</span>
                  <span>{citation.source}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      <style jsx>{`
        :global(.citation-marker) {
          color: #3b82f6;
          cursor: default;
          font-size: 0.75em;
          font-weight: 600;
          margin: 0 1px;
          transition: all 0.2s ease;
        }

        :global(.citation-marker:hover) {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
