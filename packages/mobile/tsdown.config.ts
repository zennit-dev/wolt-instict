import { createTsdownConfig, type TsdownConfig } from "@zenncore/tsdown-config";
import {
  getComponentsOptions,
  getUtilsOptions,
} from "@zenncore/tsdown-config/options";

//TODO: for other utils folders other than helpers|hooks|types
// const utilsFolders = fs
//   .readdirSync("./src/utils", { withFileTypes: true })
//   .filter((dirent) => dirent.isDirectory())
//   .map((dirent) => dirent.name)
//   .filter((folderName) => {
//     const indexPath = `./src/utils/${folderName}/index.ts`;
//     return fs.existsSync(indexPath);
//   });

// const utilsEntries = utilsFolders.reduce<Record<string, string>>(
//   (accumulator, folderName) => {
//     accumulator[`${folderName}/index`] = `./src/utils/${folderName}/index.ts`;
//     return accumulator;
//   },
//   {},
// );

const options = [
  {
    entry: {
      "config/metro/index": "./src/config/metro/index.ts",
    },
    copy: {
      from: "./src/config/metro/transformers/legacy-icon-transformer.cjs",
      to: "./dist/config/metro/transformers/legacy-icon-transformer.cjs",
    },
    //TODO: remove cjs when expo updates to metro 0.83.2 (supports esm and typescript)
    format: ["cjs"],
  },
  {...getComponentsOptions(),
    inputOptions: {
      transform: {
        jsx: "preserve",
      },
    },
  },
  ...getUtilsOptions("./src/utils"),
] satisfies TsdownConfig;

export default createTsdownConfig(
  options.filter(({ entry }) => entry && Object.keys(entry).length > 0)
);
