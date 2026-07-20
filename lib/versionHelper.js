/**
 * Compares two semantic version strings (e.g. "1.0.0" vs "1.5.6").
 * Returns:
 *  -1 if v1 < v2 (v1 is older than v2 -> update needed)
 *   0 if v1 === v2 (versions match)
 *   1 if v1 > v2 (v1 is newer than v2)
 */
export function compareVersions(v1, v2) {
  if (!v1 && !v2) return 0;
  if (!v1) return -1;
  if (!v2) return 1;

  const cleanV1 = String(v1).replace(/^v/i, '').trim();
  const cleanV2 = String(v2).replace(/^v/i, '').trim();

  const parts1 = cleanV1.split('.').map(n => parseInt(n, 10) || 0);
  const parts2 = cleanV2.split('.').map(n => parseInt(n, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }

  return 0;
}
