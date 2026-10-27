const capitalizedWord = "[A-Z][A-Za-z0-9.'-]*";
const suffix =
  "Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Place|Pl|Way|Terrace|Ter";
const phoneSep = "[-.\\s\\u2011]";

function street(source) {
  return new RegExp(source, "g");
}

export const rules = [
  {
    id: "phone-number",
    pattern: new RegExp(
      `(?<![\\w+])(?:\\+?1${phoneSep})?\\(\\d{3}\\)\\s*[-.\\u2011]?\\s*\\d{3}${phoneSep}\\d{4}\\b`,
      "g",
    ),
  },
  {
    id: "phone-number",
    pattern: new RegExp(
      `(?<![\\w+])(?:\\+?1${phoneSep})?\\d{3}${phoneSep}\\d{3}${phoneSep}\\d{4}\\b`,
      "g",
    ),
  },
  {
    id: "phone-number",
    pattern: new RegExp(
      `(?<!\\w)\\+\\d{1,3}${phoneSep}\\d{1,4}${phoneSep}\\d{1,4}${phoneSep}\\d{1,4}\\b`,
      "g",
    ),
  },
  {
    id: "phone-number",
    pattern: /\btel:\+?[\d().\s\u2011-]{7,}\d/gi,
  },
  {
    id: "phone-number",
    pattern: /(?<![\w+])(?:\+?1)?\d{10}\b/g,
  },
  {
    id: "street-address",
    pattern: street(
      `\\b\\d{1,6}\\s+(?:${capitalizedWord}\\s+){1,5}(?:${suffix})\\b\\.?(?!\\s+[a-z])`,
    ),
  },
  {
    id: "street-address",
    pattern: street(
      `\\b\\d{1,6}(?:st|nd|rd|th)\\s+(?:${capitalizedWord}\\s+){0,4}(?:${suffix})\\b\\.?(?!\\s+[a-z])`,
    ),
  },
  {
    id: "street-address",
    pattern: street(
      "\\b\\d{1,6}\\s+(?:[a-z][a-z0-9.'-]*\\s+){1,5}(?:street|avenue|road|boulevard|drive|lane|court|place|terrace)\\b\\.?(?!\\s+[a-z])",
    ),
  },
  {
    id: "street-address",
    pattern: /\bP\.?\s*O\.?\s*Box\s+#?\d+\b/gi,
  },
];
