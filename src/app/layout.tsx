import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const body = DM_Sans({
  variable: "--font-body-text",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://goldenratio.clinic"),
  title: "Quiet Hours — An unhurried enquiry into medicine",
  description:
    "Quiet Hours. A considered pre-screening service for Australian telehealth consultations — by appointment, at your own pace. Confidential. Unhurried. Without obligation.",
  keywords: [
    "telehealth Australia",
    "Australian medical practitioners",
    "Ahpra registered doctors",
    "telehealth consultation",
    "registered nurse consultation",
    "confidential medical service",
    "Australia-wide telehealth",
    "Quiet Hours",
  ],
  openGraph: {
    title: "Quiet Hours — An unhurried enquiry into medicine",
    description:
      "A considered pre-screening service for Australian telehealth consultations. By appointment, at your own pace.",
    type: "website",
    locale: "en_AU",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-AU"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
