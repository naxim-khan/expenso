export function formatCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function normalizeCategoryName(name: string): string {
  return formatCategoryName(name).toLowerCase();
}
