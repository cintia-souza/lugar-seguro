import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Caveat } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import LumiMascot from "@/components/LumiMascot";
import LumiWelcome from "@/components/LumiWelcome";
import ThemeLoader from "@/components/ThemeLoader";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FAFCFF",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://meulugarzinho.com.br"),
  title: {
    default: "Meu Lugarzinho — Espaço seguro de autocuidado emocional",
    template: "%s | Meu Lugarzinho",
  },
  description:
    "Plataforma gratuita e privada de autocuidado para ansiedade, depressão e neurodivergência. Desabafe com análise empática, escreva no diário emocional e pratique exercícios terapêuticos de respiração e grounding.",
  keywords: [
    "como aliviar crise de ansiedade",
    "diário de desabafo anônimo",
    "organizar pensamentos autismo",
    "exercícios de grounding ansiedade",
    "app saúde mental gratuito",
    "técnicas TCC online",
    "espaço seguro neurodivergente",
    "como parar crise de pânico",
    "diário emocional online",
    "exercícios de respiração para ansiedade",
    "terapia cognitivo comportamental online",
    "autocuidado saúde mental",
  ],
  authors: [{ name: "Meu Lugarzinho" }],
  creator: "Meu Lugarzinho",
  publisher: "Meu Lugarzinho",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://meulugarzinho.com.br",
    siteName: "Meu Lugarzinho",
    title: "Meu Lugarzinho — Espaço seguro de autocuidado emocional",
    description: "Desabafe com análise empática, escreva no diário emocional e pratique exercícios terapêuticos. Gratuito e privado.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Meu Lugarzinho — Seu espaço seguro de autocuidado",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Meu Lugarzinho — Autocuidado emocional gratuito",
    description: "Plataforma privada para ansiedade, depressão e neurodivergência.",
    images: ["/og-image.png"],
  },
  verification: {
    google: "COLOQUE_SEU_CODIGO_AQUI",
  },
  category: "health",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" dir="ltr" className={`${geist.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-slate-800">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Pular para o conteúdo principal
        </a>
        <AuthProvider>
          <AppProvider>
            <ThemeLoader />
            <Navbar />
            <main id="main-content" className="flex min-h-[calc(100vh-8rem)] flex-col">
              <PageTransition>
                {children}
              </PageTransition>
            </main>
            <Footer />
            <LumiMascot />
            <LumiWelcome />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
