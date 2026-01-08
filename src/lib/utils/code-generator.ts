/**
 * Generates a code from name and description
 * Format: First 3-4 letters of each significant word, uppercase, max 8-10 chars
 */
export function generateCode(name: string, description?: string): string {
  if (!name || name.trim().length === 0) {
    return "";
  }

  // Clean and split the name into words
  const words = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // Remove special characters
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "";
  }

  // If single word, take first 4-6 characters
  if (words.length === 1) {
    return words[0].substring(0, Math.min(6, words[0].length));
  }

  // If multiple words, take first 2-3 characters of first 2-3 words
  const codeParts: string[] = [];
  const maxWords = Math.min(3, words.length);
  
  for (let i = 0; i < maxWords; i++) {
    const word = words[i];
    if (word.length >= 3) {
      codeParts.push(word.substring(0, 3));
    } else {
      codeParts.push(word);
    }
  }

  let code = codeParts.join("");
  
  // If code is too short and we have description, try to add from description
  if (code.length < 4 && description) {
    const descWords = description
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length >= 3);
    
    if (descWords.length > 0) {
      code += descWords[0].substring(0, Math.min(3, descWords[0].length));
    }
  }

  // Ensure code is between 4-10 characters
  code = code.substring(0, Math.min(10, Math.max(4, code.length)));

  return code;
}
