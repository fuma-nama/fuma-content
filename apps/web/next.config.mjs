import { createContent } from "fuma-content/next";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

const withContent = await createContent();

export default withContent(config);
