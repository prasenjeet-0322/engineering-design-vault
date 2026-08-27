/**
 * Helper plugin module for demonstrating dynamic import() and code-splitting
 */

export const PLUGIN_VERSION = "3.2.0";

export function computeMetrics(data) {
  return data.reduce((acc, curr) => acc + curr, 0);
}

export default function renderPluginWidget() {
  return "⚡ [Heavy Analytics Widget HTML Content Rendered]";
}
