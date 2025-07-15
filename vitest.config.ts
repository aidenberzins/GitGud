import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  test: {
    include: [], // clear global includes
    projects: [
      {
        plugins: [react()],
        test: {
          include: ["problems/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          include: ["problems/**/*.test.tsx"],
          environment: "jsdom",
        },
      },
    ],
  },
});
