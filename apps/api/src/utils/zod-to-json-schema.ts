// Utility to convert Zod schemas to JSON Schema for Fastify validation
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export function toJsonSchema<T extends z.ZodTypeAny>(schema: T): object {
  return zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  });
}

export function toJsonSchemaWithRefs<T extends z.ZodTypeAny>(schema: T): object {
  return zodToJsonSchema(schema, {
    target: 'jsonSchema7',
    $refStrategy: 'root',
  });
}