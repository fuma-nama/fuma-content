import { createContent } from "fuma-content/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default async () => {
  const withContent = await createContent();
  return withContent(config);
};
