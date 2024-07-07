import { z } from "zod";
import type { AnyZodObject } from "zod";
import type { MDXContent } from "mdx/types";
import micromatch from "micromatch";

export interface CreateOptions {
  schema?: AnyZodObject;

  /**
   * Filter file paths
   */
  include?: string | string[];
}

export interface Document<Info = unknown> {
  info: Info;

  /**
   * Render data, should be accepted by renderer
   */
  renderer: MDXContent;

  /**
   * File Path
   */
  file: string;
}

export interface Json<Info = unknown> {
  info: Info;

  /**
   * File Path
   */
  file: string;
}

const defaultSchema = z.record(z.string(), z.unknown());

interface RawFile {
  file: string;
  format: string;
}

interface RawDocument extends RawFile {
  frontmatter: Record<string, unknown>;
  default: () => unknown;
  [key: string]: unknown;
}

interface RawJson extends RawFile {
  default: Record<string, unknown>;
}

type GetInfoType<T extends CreateOptions> = T["schema"] extends AnyZodObject
  ? z.infer<T["schema"]>
  : Record<string, unknown>;

export function document<T extends CreateOptions>(
  entryPoint: unknown,
  options?: T,
): Document<GetInfoType<T>>[] {
  const { schema = defaultSchema, include } = options ?? {};

  return read<RawDocument>(entryPoint, ["md", "mdx"], include).map((item) => {
    const {
      default: render,
      format: _format,
      file,
      frontmatter,
      ...rest
    } = item;
    const result = schema.safeParse(frontmatter);
    if (!result.success) throw createError(file, result.error);

    return {
      file,
      info: result.data,
      renderer: render as MDXContent,
      ...rest,
    };
  });
}

export function json<T extends CreateOptions>(
  entryPoint: unknown,
  options?: T,
): Json<GetInfoType<T>>[] {
  const { schema = defaultSchema, include } = options ?? {};

  return read<RawJson>(entryPoint, ["json"], include).map(
    ({ file, default: data }) => {
      const result = schema.safeParse(data);
      if (!result.success) throw createError(file, result.error);

      return {
        file,
        info: result.data,
      };
    },
  );
}

function createError(file: string, err: z.ZodError): Error {
  const message = `${file}:\n${Object.entries(err.flatten().fieldErrors)
    .map(([k, v]) => `${k}: ${v?.join(", ") ?? ""}`)
    .join("\n")}`;

  return new Error(message);
}

function read<T extends RawFile>(
  entryPoint: unknown,
  format: string[],
  include?: string | string[],
): T[] {
  const cast = entryPoint as Record<string, T[]>;
  const entries = format.flatMap((f) => cast[f] ?? []);

  return entries.filter((e) => !include || micromatch.isMatch(e.file, include));
}
