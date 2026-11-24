// Sort records so the most recently created appear first.
// Uses created_at when both records have it, otherwise falls back to the id (higher id = newer).
// Returns a new array; the input is not modified.
export const sortNewestFirst = (items) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const ta = Date.parse(a?.created_at);
    const tb = Date.parse(b?.created_at);
    if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) {
      return tb - ta;
    }
    return (Number(b?.id) || 0) - (Number(a?.id) || 0);
  });
};
