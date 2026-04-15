import type { Metadata } from "next";
import { ThemeProvider, themeInitScript } from "./theme-provider";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Patient Portal | Golden Ratio Clinics",
  description:
    "Secure patient portal for Golden Ratio Clinics. View your appointments, prescriptions, and clinical updates. Sign in with Google or email.",
  robots: { index: false, follow: false },
};

/**
 * Patient portal shell.
 *
 * - `metadata.robots = noindex` keeps search engines out of the portal
 * - `themeInitScript` runs before paint to set data-theme on <html>,
 *   preventing flash of incorrect theme on first load
 * - `ThemeProvider` exposes theme state to any client component
 *
 * The portal uses its own CSS variables (--portal-*) defined in
 * globals.css — these are scoped by data-theme and do not affect the
 * marketing variations under /v/*.
 */
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
}
