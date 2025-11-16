import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default ({ children }: LayoutProps<"/">) => {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} root isolate h-screen w-screen overflow-hidden bg-background-dimmed font-body text-foreground antialiased transition-colors duration-300`}
        style={
          {
            "--font-header": "var(--font-bogart)",
            "--font-body": "var(--font-geist)",
          } as React.CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
};
