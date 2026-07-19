/**
 * @param value 
 * @param visible 
*/
export function maskSecret(value: string, visible = 4): string {
  if (!value) return '';
  if (value.length <= visible) return '*'.repeat(value.length);
  return `${'*'.repeat(value.length - visible)}${value.slice(-visible)}`;
}