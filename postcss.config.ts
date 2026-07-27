// postcss doesn't export a 'Config' type in some versions; use a permissive type here
import type { Plugin } from "postcss";

const config: { plugins: Record<string, Plugin | Record<string, unknown>> } = {
  plugins: {
    "@tailwindcss/postcss": {},
    "autoprefixer": {},
  },
};

export default config;
