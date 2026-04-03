import { ReactNode } from 'react';

interface JsonLdProps {
  schema: Record<string, any>;
}

/**
 * JsonLd component for rendering JSON-LD structured data.
 * Use this to add schema.org structured data to pages.
 * 
 * @param schema - The JSON-LD schema object
 * @returns A script tag with the schema embedded
 * 
 * @example
 * <JsonLd schema={organizationSchema} />
 */
export default function JsonLd({ schema }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      suppressHydrationWarning
    />
  );
}
