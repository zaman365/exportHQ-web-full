export const EXPORT_PANEL_BASE_PATH = "/ExportPanel";

export function exportPanelPath(path = "/"): string {
  if (path === EXPORT_PANEL_BASE_PATH || path.startsWith(`${EXPORT_PANEL_BASE_PATH}/`) || path.startsWith(`${EXPORT_PANEL_BASE_PATH}?`)) {
    return path;
  }
  return path === "/" ? EXPORT_PANEL_BASE_PATH : `${EXPORT_PANEL_BASE_PATH}${path}`;
}
