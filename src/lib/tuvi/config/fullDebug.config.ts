import type { SchoolConfig } from "./types";
import { tuvichancoCompatibleConfig } from "./tuvichancoCompatible.config";
import { FULL_DEBUG_VISIBLE_STAR_POLICY } from "../rules/visibleStarPolicy";

export const fullDebugConfig: SchoolConfig = {
  ...tuvichancoCompatibleConfig,
  id: "fullDebug",
  name: "Full Debug",
  visibleStarPolicy: FULL_DEBUG_VISIBLE_STAR_POLICY,
};
