import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AbleSpace",
  description: "AbleSpace task management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem("ablespace-ui")||"{}");var d=s.theme==="dark";if(d)document.documentElement.classList.add("dark");var hex=s.accentHex||"#171717";if(d&&s.accentId==="black"){hex="#e4e4e7";document.documentElement.style.setProperty("--accent-foreground","#18181b");}document.documentElement.style.setProperty("--accent",hex);}catch(e){}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
