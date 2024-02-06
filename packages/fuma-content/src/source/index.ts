import { z } from "zod";
import type { AnyZodObject } from "zod";

export interface CreateOptions {
  schema?: AnyZodObject;
}

export interface Document<Info = unknown, Render = unknown> {
  info: Info;

  /**
   * Render data, should be accepted by renderer
   */
  renderer: Render;

  /**
   * File Path
   */
  file: string;
}

const defaultSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

type DefaultSchema = z.infer<typeof defaultSchema>;

interface RawItem {
  file: string;
  frontmatter: Record<string, unknown>;
  default: () => unknown;
  [key: string]: unknown;
}

export function source<T extends CreateOptions>(
  fromMap: unknown,
  options: T
): Document<
  T["schema"] extends AnyZodObject ? z.infer<T["schema"]> : DefaultSchema
>[] {
  const { schema = defaultSchema } = options;
  const items = fromMap as RawItem[];

  return items.map((item) => {
    const { default: render, file, frontmatter, ...rest } = item;
    const result = schema.safeParse(frontmatter);
    if (!result.success) throw result.error;

    return {
      file,
      info: result.data,
      renderer: render,
      ...rest,
    };
  });
}
