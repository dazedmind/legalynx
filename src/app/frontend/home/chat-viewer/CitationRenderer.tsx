'use client';

import React, { useState } from 'react';

interface Citation {
  number: string;
  source: string;
}

interface GroupedCitation {
  numbers: string[];
  count: number;
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
  const [hoveredCitation, setHoveredCitation] = useState<{ 
    num?: string; 
    element: HTMLElement;
    isGrouped?: boolean;
    groupedNumbers?: string[];
  } | null>(null);

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

    // First, detect and replace multiple consecutive citations with pills
    // Pattern 1: Handle citations with carets: ^[1]^[2]^[3]
    // Pattern 2: Handle citations without carets: [1][2][3]
    processedContent = processedContent.replace(
      /(?:\^?\[(\d+)\])+/g,
      (match) => {
        // Extract all citation numbers from this group (with or without caret)
        const citationNumbers = Array.from(match.matchAll(/\^?\[(\d+)\]/g)).map(m => m[1]);
        
        if (citationNumbers.length === 1) {
          // Single citation - use normal format
          const citationNum = citationNumbers[0];
          const citation = citations.get(citationNum);
          if (!citation) return match;
          
          const uniqueId = `citation-${citationNum}-${citationIndex++}`;
          return `<sup class="citation-marker" id="${uniqueId}" data-citation="${citationNum}" data-source="${citation.source}">[${citationNum}]</sup>`;
        } else {
          // Multiple citations - use pill format
          const uniqueId = `citation-group-${citationIndex++}`;
          const numbersJson = JSON.stringify(citationNumbers);
          return `<span class="citation-pill" id="${uniqueId}" data-grouped="true" data-citation-numbers='${numbersJson}'>${citationNumbers.length} sources</span>`;
        }
      }
    );

    return processedContent;
  };

  const handleCitationHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Handle grouped citations (pill format)
    if (target.classList.contains('citation-pill')) {
      const isGrouped = target.getAttribute('data-grouped') === 'true';
      const numbersJson = target.getAttribute('data-citation-numbers');
      
      if (isGrouped && numbersJson) {
        try {
          const groupedNumbers = JSON.parse(numbersJson);
          setHoveredCitation({ 
            element: target,
            isGrouped: true,
            groupedNumbers
          });
        } catch (e) {
          setHoveredCitation(null);
        }
      }
    }
    // Handle single citations
    else if (target.classList.contains('citation-marker')) {
      const citationNum = target.getAttribute('data-citation');
      if (citationNum) {
        setHoveredCitation({ 
          num: citationNum, 
          element: target,
          isGrouped: false
        });
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
      {hoveredCitation && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2"
          style={{
            ...getTooltipPosition(),
            maxWidth: hoveredCitation.isGrouped ? '350px' : '250px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {hoveredCitation.isGrouped && hoveredCitation.groupedNumbers ? (
            // Show grouped citations
            <>
              <div className="font-medium mb-2 flex items-center gap-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-purple-600">
                  {hoveredCitation.groupedNumbers.length} sources
                </span>
              </div>
              <div className="space-y-1.5">
                {hoveredCitation.groupedNumbers.map((num, idx) => {
                  const citation = citations.get(num);
                  return citation ? (
                    <div key={idx} className="text-xs opacity-90 leading-relaxed">
                      <div className="flex gap-1.5">
                        <span className="text-purple-400 font-semibold flex-shrink-0">[{num}]</span>
                        <span>{citation.source}</span>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </>
          ) : hoveredCitation.num && citations.has(hoveredCitation.num) ? (
            // Show single citation
            <>
              <div className="font-medium mb-1">Source {hoveredCitation.num}:</div>
              <div>{citations.get(hoveredCitation.num)?.source}</div>
            </>
          ) : null}
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

        :global(.citation-pill) {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 0.7em;
          font-weight: 600;
          padding: 2px 8px;
          margin: 0 2px;
          border-radius: 12px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
          color: white;
          cursor: default;
          transition: all 0.2s ease;
          vertical-align: baseline;
          line-height: 1.2;
          box-shadow: 0 1px 3px rgba(139, 92, 246, 0.3);
        }

        :global(.citation-pill:hover) {
          background: linear-gradient(135deg, #7c3aed 0%, #5855eb 100%);
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.4);
          transform: translateY(-1px);
        }

        /* Custom scrollbar for tooltip */
        div::-webkit-scrollbar {
          width: 6px;
        }

        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 3px;
        }

        div::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
}
