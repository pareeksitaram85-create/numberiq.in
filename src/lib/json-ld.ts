// Serialize a schema.org object for a <script type="application/ld+json">
// block. Escapes "<" so content containing "</script>" (or any HTML) cannot
// break out of the script element — JSON.stringify alone does not do this.
export function jsonLdString(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
