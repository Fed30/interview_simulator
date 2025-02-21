"use client"
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'; 
import { AuthProvider } from './context/AuthContext';
import { InsightPanelProvider } from './context/InsightPanelContext';
import { AnalyticsPanelProvider } from './context/AnalyticsPanelContext';
import { FeedbackPanelProvider  } from './context/FeedbackPanelContext';
import { LoadingProvider } from './context/LoadingContext';
import Spinner from './components/spinner';
import Header from './components/header';
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "react-query";

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
  const isChatPage = pathname === "/chat"; // Adjust this if your chat page has a different route

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LoadingProvider>
          <AuthProvider>
          <QueryClientProvider client={queryClient}>
              <InsightPanelProvider>
                <AnalyticsPanelProvider>
                  <FeedbackPanelProvider>
                    {!isChatPage && <Header />} {/* Hide Header on chat page */}
                    <main>{children}</main>
                    <Spinner />
                      <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={true} />
                  </FeedbackPanelProvider>
                </AnalyticsPanelProvider>
              </InsightPanelProvider >
            </QueryClientProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
