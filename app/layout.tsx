import type { Metadata } from "next";
import { Inter, Hedvig_Letters_Serif } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const hedvigLetters = Hedvig_Letters_Serif({
  variable: "--font-hedvig",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Taloo | Admin workspace",
    template: "%s | Admin workspace",
  },
  description: "Manage your WhatsApp and voice agents",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${hedvigLetters.variable} antialiased`}>
        <AuthProvider>
          <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
            {children}
            <Toaster position="bottom-right" richColors />
          </Theme>
        </AuthProvider>
      </body>
    </html>
  );
}
