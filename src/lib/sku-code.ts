export function generateSkuCode(
  shopCode: string,
  category: string,
  color: string,
  count: number
) {
  const cat = category.slice(0, 3).toUpperCase();
  const col = color.slice(0, 3).toUpperCase();
  const nnn = String(count).padStart(3, "0");
  return `${shopCode}-${cat}-${col}-${nnn}`;
}
