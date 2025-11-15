import { createTsdownConfig } from "@zenncore/tsdown-config";

export default createTsdownConfig({
  entry: ["./src/index.ts"],
  inputOptions: {
    transform: {
      jsx: "preserve",
    },
  },
});
