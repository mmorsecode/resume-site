export const rules = [
  {
    id: "phone-number",
    pattern: /(?<![\w+])(?:\+?1[-.\s])?\(\d{3}\)\s*[-.]?\s*\d{3}[-.\s]\d{4}\b/g,
  },
  {
    id: "phone-number",
    pattern: /(?<![\w+])(?:\+?1[-.\s])?\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g,
  },
  {
    id: "phone-number",
    pattern: /(?<!\w)\+\d{1,3}[-.\s]\d{1,4}[-.\s]\d{1,4}[-.\s]\d{1,4}\b/g,
  },
  {
    id: "street-address",
    pattern:
      /\b\d{1,6}\s+(?:[A-Za-z][A-Za-z0-9.'-]*\s+){1,5}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Terrace|Ter)\b\.?/gi,
  },
];
