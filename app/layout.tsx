import type { Metadata } from "next";
import { Inter, Hedvig_Letters_Serif } from "next/font/google";
import { Theme } from "@radix-ui/themes";
import "./globals.css";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

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
  title: "Taloo Admin",
  description: "Manage your WhatsApp and voice agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${hedvigLetters.variable} antialiased`}>
        <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="100%">
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-auto">
              <Header />
              <div className="flex-1 p-6 bg-white">
                {children}
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Theme>
      </body>
    </html>
  );
}
