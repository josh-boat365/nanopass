// Shared password policy helpers.
// The backend stores only `regex_text`, so the requirements are read back from it
// and the pattern is always rebuilt from them. Old stored patterns therefore
// validate correctly without a database update.

// Build a regex from requirement flags. Any non-whitespace character is allowed;
// the lookaheads enforce the required character types.
export const generateRegex = (requirements) => {
  const {
    minLength,
    requireUppercase,
    requireLowercase,
    requireNumbers,
    requireSpecialChars,
  } = requirements;

  const lookaheads = [];
  if (requireUppercase) lookaheads.push("(?=.*[A-Z])");
  if (requireLowercase) lookaheads.push("(?=.*[a-z])");
  if (requireNumbers) lookaheads.push("(?=.*\\d)");
  if (requireSpecialChars) lookaheads.push("(?=.*[@$!%*?&])");

  return `^${lookaheads.join("")}\\S{${minLength},}$`;
};

// Read requirement flags back from a saved regex.
export const parseRequirementsFromRegex = (regexText) => {
  const text = regexText || "";
  const minMatch = text.match(/\{(\d+),\}\$?$/);
  return {
    minLength: minMatch ? Number(minMatch[1]) : 8,
    requireUppercase: text.includes("(?=.*[A-Z])"),
    requireLowercase: text.includes("(?=.*[a-z])"),
    requireNumbers: text.includes("(?=.*\\d)"),
    requireSpecialChars: text.includes("(?=.*[@$!%*?&])"),
  };
};

// The pattern to enforce for a stored policy: rebuilt from its requirements.
export const effectiveRegex = (regexText) =>
  generateRegex(parseRequirementsFromRegex(regexText));
