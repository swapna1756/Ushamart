/**
 * Strips off size/unit suffixes at the end of product names to identify base products
 * e.g., "Maaza 250 ml" -> "Maaza", "Amul Milk 1L" -> "Amul Milk"
 */
export function getProductBaseName(name) {
  if (!name) return '';
  return name
    .replace(/\s*\d+(\.\d+)?\s*(ml|l|g|kg|pcs|pc|gm|kg|ltr|packet|pack|can|bottle|sachet|g|oz|lbs|ml)\b/gi, '')
    .trim();
}

/**
 * Filter and group products by base name to avoid duplicates
 */
export function searchAndGroupProducts({ products, categories, query, pincode, selectedCategoryId = null }) {
  if (!products) return [];

  const cleanQuery = (query || '').trim().toLowerCase();
  
  // Create category map for fast lookup
  const categoryMap = {};
  if (categories) {
    categories.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });
  }

  // 1. Initial Filtering (Status, Pincode, Category, Search Query)
  let filtered = products.filter(p => {
    // Pincode filter
    if (pincode) {
      if (p.pincodesAvailable && p.pincodesAvailable.length > 0 && !p.pincodesAvailable.includes(pincode)) {
        return false;
      }
    }

    // Category filter (if explicitly filtering by category tab/page)
    if (selectedCategoryId && p.category !== selectedCategoryId) {
      return false;
    }

    // If query is empty, it matches everything (e.g. for initial list)
    if (!cleanQuery) return true;

    // Search query matching
    const nameMatch = (p.name || '').toLowerCase().includes(cleanQuery);
    const brandMatch = (p.brand || '').toLowerCase().includes(cleanQuery);
    const subcategoryMatch = (p.subcategory || '').toLowerCase().includes(cleanQuery);
    const skuMatch = (p.sku || '').toLowerCase().includes(cleanQuery);
    const descMatch = (p.description || '').toLowerCase().includes(cleanQuery);
    const specMatch = (p.specifications || '').toLowerCase().includes(cleanQuery);
    
    // Category name match
    const categoryName = categoryMap[p.category] || '';
    const categoryMatch = categoryName.toLowerCase().includes(cleanQuery);

    return nameMatch || brandMatch || categoryMatch || subcategoryMatch || skuMatch || descMatch || specMatch;
  });

  // 2. Grouping variants of the same product
  const groups = {};
  filtered.forEach(p => {
    const baseName = getProductBaseName(p.name).toLowerCase();
    const brand = (p.brand || '').toLowerCase();
    const groupKey = `${brand}::${baseName}`;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(p);
  });

  // 3. For each group, pick a representative product and aggregate variant info
  return Object.values(groups).map(group => {
    // Sort group products so the lowest price or in-stock one is representative
    const sortedGroup = [...group].sort((a, b) => {
      const aInStock = (a.stock || 0) > 0 ? 1 : 0;
      const bInStock = (b.stock || 0) > 0 ? 1 : 0;
      if (aInStock !== bInStock) return bInStock - aInStock; // prioritize in stock
      return (a.price || 0) - (b.price || 0); // then lowest price
    });

    const rep = sortedGroup[0]; // Representative product
    const allPrices = group.map(p => p.price).filter(price => price !== undefined);
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : rep.price;
    const maxDiscount = Math.max(...group.map(p => p.discountPercent || 0));
    const anyInStock = group.some(p => (p.stock || 0) > 0);

    return {
      ...rep,
      displayName: getProductBaseName(rep.name), // e.g. "Maaza"
      startingPrice: minPrice,
      maxDiscount: maxDiscount,
      anyInStock: anyInStock,
      variantsCount: group.length,
      variantsList: group.map(p => ({
        id: p.id,
        unit: p.unit || p.variants || 'Default',
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        images: p.images
      }))
    };
  });
}
