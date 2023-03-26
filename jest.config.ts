// 型定義のインポート
import { Config } from "@jest/types";

// オプションを設定
const config: Config.InitialOptions = {
	preset: "ts-jest",
	testMatch: ["<rootDir>/tests/**/*.test.ts"],
	testEnvironment: "node",
	transformIgnorePatterns: ["/node_modules/(?!@svgdotjs/svg.filter.js/)"],
	transform: {
		"node_modules/@svgdotjs/svg.filter.js/.+.js?$": "ts-jest",
	},
};

// 設定を default エクスポートします
export default config;
