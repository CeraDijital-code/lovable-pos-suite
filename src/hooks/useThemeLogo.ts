import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useTheme } from "next-themes";

/**
 * Returns the appropriate logo URL based on the current theme.
 * Falls back to whichever logo is available if only one is set.
 */
export function useThemeLogo() {
  const { data: settings } = useStoreSettings();
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  const logoUrl = isDark
    ? settings?.logo_dark_url || settings?.logo_light_url
    : settings?.logo_light_url || settings?.logo_dark_url;

  return {
    logoUrl: logoUrl || null,
    logoDarkUrl: settings?.logo_dark_url || null,
    logoLightUrl: settings?.logo_light_url || null,
    isDark,
  };
}
