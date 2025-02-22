"use client"
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { AuthProvider } from './context/AuthContext';
import { InsightPanelProvider } from './context/InsightPanelContext';
import { AnalyticsPanelProvider } from './context/AnalyticsPanelContext';
import { FeedbackPanelProvider } from './context/FeedbackPanelContext';
import { BadgesPanelProvider } from './context/BadgesPanelContext';
import { BadgesAwardsProvider  } from './context/BadgeAwardsContext';
import { LoadingProvider } from './context/LoadingContext';
import Spinner from './components/spinner';
import Header from './components/header';
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "react-query";
import BadgeAwardsModal from "./components/ModalBadgeAwards";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const metadata = {
  title: "Interview Simulator",
  description: "Interview Simulator",
  icons: {
    icon: "/logo.png",
  },
};
const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); 
  const isChatPage = pathname === "/chat"; 

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LoadingProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <BadgesAwardsProvider>
                <InsightPanelProvider>
                  <AnalyticsPanelProvider>
                    <FeedbackPanelProvider>
                      <BadgesPanelProvider>
                        {!isChatPage && <Header />} 
                        <main>{children}
                        {!isChatPage && <BadgeAwardsModal />}
                        </main>
                        <Spinner />
                          <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={true} />
                      </BadgesPanelProvider>
                    </FeedbackPanelProvider>
                  </AnalyticsPanelProvider>
                  </InsightPanelProvider >
              </BadgesAwardsProvider>
            </QueryClientProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
