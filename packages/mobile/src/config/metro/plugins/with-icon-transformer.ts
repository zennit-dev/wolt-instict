import path from "node:path";
import type { MetroConfig } from "expo/metro-config";

/**
 * Add the icon transformer to the metro config;
 * this does edit the babel transformer path to intercept for icon files,
 * with a fallback to the default expo/babel transformer for other files;
 *
 * @param config - The Metro configuration object
 *
 * @returns The modified Metro configuration
 */

export const withIconTransformer = (config: MetroConfig): MetroConfig => {
  const transformerPath = path.resolve(
    __dirname,
    "./transformers/legacy-icon-transformer.cjs",
  );

  return {
    ...config,
    transformer: {
      ...config.transformer,
      babelTransformerPath: transformerPath,
    },
  };
};
