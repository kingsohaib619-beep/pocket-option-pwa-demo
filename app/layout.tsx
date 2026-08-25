import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title:"PO Bot Pro Demo", description:"Mobile PWA demo trading dashboard",
  manifest:"/manifest.webmanifest"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}