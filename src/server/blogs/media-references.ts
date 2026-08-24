import "server-only";

/**
 * Extracts and validates media references from markdown content.
 * 
 * Syntax expected: ![ALT](media://UUID)
 * 
 * @param contentMarkdown The raw markdown string
 * @returns Array of unique UUIDs referenced in the markdown
 * @throws Error with user-friendly message if any reference is malformed
 */
export function extractMediaReferences(contentMarkdown: string): string[] {
  // If no reference at all, fast return
  if (!contentMarkdown.includes("media://")) {
    return [];
  }

  // Find all occurrences of media://
  const allMediaOccurrences = contentMarkdown.match(/media:\/\//g) || [];
  
  // Valid syntax regex: ![anything but brackets](media://uuid)
  // UUID must be 36 chars: 8-4-4-4-12
  const validRegex = /!\[([^\]]*)\]\(media:\/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\)/gi;
  
  const validMatches = [...contentMarkdown.matchAll(validRegex)];

  // If the counts don't match, it means there are malformed media:// usages
  if (allMediaOccurrences.length !== validMatches.length) {
    throw new Error("El contenido contiene una referencia multimedia inválida.");
  }

  const uniqueIds = new Set<string>();

  for (const match of validMatches) {
    const altText = match[1].trim();
    if (!altText) {
      throw new Error("Cada imagen debe tener un texto alternativo.");
    }

    const uuid = match[2].toLowerCase();
    
    uniqueIds.add(uuid);
  }

  return Array.from(uniqueIds);
}
