/**
 * Escapes a cell value for a CSV file.
 * Protects against CSV Formula Injection.
 */
export function escapeCsvCell(value: string | null | undefined): string {
  if (value == null) return "";
  
  let strValue = String(value).trim();
  
  // Protect against CSV Formula Injection
  if (/^[=+\-@]/.test(strValue)) {
    strValue = "'" + strValue;
  }
  
  // If it contains quotes, commas, or newlines, wrap in quotes and escape quotes
  if (/[",\n\r]/.test(strValue)) {
    return '"' + strValue.replace(/"/g, '""') + '"';
  }
  
  return strValue;
}
