// Ethical Humanitarian Assisted Matching Engine (ICRC & UNICEF Compliant)
// Strictly rule-based: Evaluates candidate matches based on names, age ranges, and clothing notes.
// Biometric, facial recognition, and automated identity merging are strictly disabled.

export interface MatchCandidate {
  profile: any;
  score: number; // 0 - 100%
  reasons: string[];
  requiresDualVerification: boolean;
}

// Calculate Levenshtein Distance for typo-tolerant humanitarian name comparisons
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];

  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

function nameSimilarity(name1: string, name2: string): number {
  const n1 = (name1 || "").trim().toLowerCase();
  const n2 = (name2 || "").trim().toLowerCase();
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  // Check token / first-name overlap
  const tokens1 = n1.split(/\s+/);
  const tokens2 = n2.split(/\s+/);
  const hasCommonToken = tokens1.some((t) => t.length > 2 && tokens2.includes(t));
  if (hasCommonToken) return 0.85;

  const maxLen = Math.max(n1.length, n2.length);
  const dist = levenshteinDistance(n1, n2);
  const sim = (maxLen - dist) / maxLen;
  return Math.max(0, sim);
}

// Extract keywords from clothing & condition notes
function extractKeywords(text?: string): string[] {
  if (!text) return [];
  const stopWords = new Set(["wears", "with", "and", "the", "in", "a", "of", "is", "mild", "severe"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

export function findAssistedMatches(target: any, pool: any[]): MatchCandidate[] {
  if (!target || !pool || pool.length === 0) return [];

  const candidates: MatchCandidate[] = [];

  for (const candidate of pool) {
    // Do not compare against self
    if (candidate.id === target.id || candidate.janRakshaCode === target.janRakshaCode) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // 1. Name Match (up to 45 pts)
    const nSim = nameSimilarity(target.fullName, candidate.fullName);
    if (nSim > 0.8) {
      score += 45;
      reasons.push(`High name similarity (${Math.round(nSim * 100)}%)`);
    } else if (nSim > 0.5) {
      score += 25;
      reasons.push(`Partial name similarity (${Math.round(nSim * 100)}%)`);
    }

    // 2. Gender Match (up to 15 pts)
    if (target.gender && candidate.gender && target.gender.toLowerCase() === candidate.gender.toLowerCase()) {
      score += 15;
      reasons.push(`Gender match (${target.gender})`);
    }

    // 3. Age Bracket Match (±3 years) (up to 25 pts)
    if (target.age && candidate.age) {
      const ageDiff = Math.abs(Number(target.age) - Number(candidate.age));
      if (ageDiff === 0) {
        score += 25;
        reasons.push(`Exact age match (${target.age} years)`);
      } else if (ageDiff <= 2) {
        score += 20;
        reasons.push(`Close age proximity (±${ageDiff} yrs)`);
      } else if (ageDiff <= 4) {
        score += 10;
        reasons.push(`Approximate age window (±${ageDiff} yrs)`);
      }
    }

    // 4. Person Classification Match (10 pts)
    if (target.personType && candidate.personType && target.personType === candidate.personType) {
      score += 10;
      reasons.push(`Category match (${target.personType})`);
    }

    // 5. Clothing & Behavioral Notes Keyword Overlap (up to 15 pts)
    const targetKeywords = extractKeywords(target.criticalNotes || target.allergies);
    const candidateKeywords = extractKeywords(candidate.criticalNotes || candidate.allergies);
    const commonKeywords = targetKeywords.filter((k) => candidateKeywords.includes(k));
    if (commonKeywords.length > 0) {
      score += Math.min(15, commonKeywords.length * 5);
      reasons.push(`Key descriptors match: "${commonKeywords.slice(0, 3).join(", ")}"`);
    }

    // Only suggest if meets threshold
    if (score >= 40) {
      const isMinor = target.personType === "CHILD" || (target.age && Number(target.age) < 18);
      candidates.push({
        profile: candidate,
        score: Math.min(98, score), // Never 100% — human operator must certify
        reasons,
        requiresDualVerification: Boolean(isMinor || target.chronicIllness),
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 4);
}
