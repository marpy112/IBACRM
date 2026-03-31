function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildResearchEntry(input = {}) {
  const title = (input.title || input.name || '').toString().trim();
  const description = (input.description || '').toString().trim();
  const researchers = Array.isArray(input.researchers)
    ? input.researchers
        .map((item) => {
          if (typeof item === 'string') {
            const name = item.toString().trim();
            return name ? { name, degree: '' } : null;
          }

          const name = (item?.name || '').toString().trim();
          const degree = (item?.degree || '').toString().trim();
          return name ? { name, degree } : null;
        })
        .filter(Boolean)
    : [input.researcher1, input.researcher2]
        .map((item) => (item || '').toString().trim())
        .filter(Boolean)
        .map((name) => ({ name, degree: '' }));
  const locationIds = Array.isArray(input.locationIds)
    ? input.locationIds.map((item) => item.toString().trim()).filter(Boolean)
    : [];

  return {
    id: input.id || `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    researchers,
    ...(locationIds.length > 0 ? { locationIds } : {}),
  };
}

function normalizeLocation(location) {
  if (!location) {
    return location;
  }

  const plain = typeof location.toObject === 'function' ? location.toObject() : location;
  const hasNestedResearches = Array.isArray(plain.researches) && plain.researches.length > 0;
  const hasLegacyResearch =
    Boolean((plain.description || '').toString().trim()) ||
    (Array.isArray(plain.researchers) && plain.researchers.length > 0);

  const researches = hasNestedResearches
    ? plain.researches.map((research) => buildResearchEntry(research))
    : hasLegacyResearch
      ? [buildResearchEntry(plain)]
      : [];

  return {
    id: plain.id,
    name: plain.name,
    latitude: plain.latitude,
    longitude: plain.longitude,
    radiusKm: plain.radiusKm,
    researches,
  };
}

module.exports = {
  slugify,
  buildResearchEntry,
  normalizeLocation,
};
