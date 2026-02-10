export interface PromptGuardResult {
  sanitizedText: string;
  riskScore: number;
  flags: string[];
  wasModified: boolean;
}

// Injection patterns with their flag names
const INJECTION_PATTERNS: Array<{ pattern: RegExp; flag: string }> = [
  // Instruction override attempts
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, flag: "instruction_override" },
  { pattern: /disregard\s+(the\s+)?(above|previous|prior)/i, flag: "instruction_override" },
  { pattern: /forget\s+(everything|all|previous)/i, flag: "instruction_override" },
  { pattern: /do\s+not\s+follow\s+(your|the|any)/i, flag: "instruction_override" },
  { pattern: /override\s+(your|the|all)\s+(instructions|rules|prompt)/i, flag: "instruction_override" },

  // Identity manipulation
  { pattern: /you\s+are\s+now\s+/i, flag: "identity_manipulation" },
  { pattern: /act\s+as\s+(if\s+you\s+are\s+|a\s+|an\s+)/i, flag: "identity_manipulation" },
  { pattern: /pretend\s+(to\s+be|you\s+are)/i, flag: "identity_manipulation" },
  { pattern: /your\s+new\s+(role|identity|persona)/i, flag: "identity_manipulation" },

  // Role injection markers
  { pattern: /^\s*system\s*:/im, flag: "role_injection" },
  { pattern: /\[system\]/i, flag: "role_injection" },
  { pattern: /\[INST\]/i, flag: "role_injection" },
  { pattern: /<<SYS>>/i, flag: "role_injection" },
  { pattern: /<\|im_start\|>/i, flag: "role_injection" },
  { pattern: /\[\/INST\]/i, flag: "role_injection" },

  // Data exfiltration attempts
  { pattern: /reveal\s+(your|the)\s+(api|secret|key|token|password|prompt)/i, flag: "data_exfiltration" },
  { pattern: /what\s+is\s+your\s+(api|secret|system)\s*(key|prompt|token)/i, flag: "data_exfiltration" },
  { pattern: /show\s+me\s+(your|the)\s+(system\s+)?prompt/i, flag: "data_exfiltration" },
];

// Role injection markers to strip
const ROLE_MARKERS = [
  /\[system\]/gi,
  /\[INST\]/gi,
  /\[\/INST\]/gi,
  /<<SYS>>/gi,
  /<<\/SYS>>/gi,
  /<\|im_start\|>.*?(?:<\|im_end\|>|\n)/gi,
];

// Zero-width and homoglyph characters
const SUSPICIOUS_UNICODE = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g;

const MAX_DESCRIPTION_LENGTH = 5000;

export function analyzeAndSanitize(text: string): PromptGuardResult {
  if (!text) {
    return { sanitizedText: "", riskScore: 0, flags: [], wasModified: false };
  }

  const flags: string[] = [];
  let sanitized = text;
  let wasModified = false;

  // 1. Detect injection patterns
  for (const { pattern, flag } of INJECTION_PATTERNS) {
    if (pattern.test(text) && !flags.includes(flag)) {
      flags.push(flag);
    }
  }

  // 2. Strip role injection markers
  for (const marker of ROLE_MARKERS) {
    const before = sanitized;
    sanitized = sanitized.replace(marker, "[BLOCKED]");
    if (sanitized !== before) wasModified = true;
  }

  // 3. Strip suspicious Unicode characters
  const beforeUnicode = sanitized;
  sanitized = sanitized.replace(SUSPICIOUS_UNICODE, "");
  if (sanitized !== beforeUnicode) {
    wasModified = true;
    if (!flags.includes("suspicious_unicode")) {
      flags.push("suspicious_unicode");
    }
  }

  // 4. Truncate if too long
  if (sanitized.length > MAX_DESCRIPTION_LENGTH) {
    sanitized = sanitized.substring(0, MAX_DESCRIPTION_LENGTH) + "\n[TRUNCATED: description exceeded maximum length]";
    wasModified = true;
    if (!flags.includes("description_truncated")) {
      flags.push("description_truncated");
    }
  }

  // 5. Calculate risk score (0-1 based on number and severity of flags)
  const severityWeights: Record<string, number> = {
    instruction_override: 0.4,
    identity_manipulation: 0.3,
    role_injection: 0.5,
    data_exfiltration: 0.4,
    suspicious_unicode: 0.1,
    description_truncated: 0.05,
  };

  let riskScore = 0;
  for (const flag of flags) {
    riskScore += severityWeights[flag] || 0.1;
  }
  riskScore = Math.min(1, riskScore);

  return { sanitizedText: sanitized, riskScore, flags, wasModified };
}
