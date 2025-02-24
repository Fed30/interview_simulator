"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider } from "./context/AuthContext";
import { InsightPanelProvider } from "./context/InsightPanelContext";
import { AnalyticsPanelProvider } from "./context/AnalyticsPanelContext";
import { FeedbackPanelProvider } from "./context/FeedbackPanelContext";
import { BadgesPanelProvider } from "./context/BadgesPanelContext";
import { BadgesAwardsProvider } from "./context/BadgeAwardsContext";
import { LoadingProvider } from "./context/LoadingContext";
import Spinner from "./components/spinner";
import Header from "./components/header";
import BadgeAwardsModal from "./components/ModalBadgeAwards";

const queryClient = new QueryClient();

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatPage = pathname === "/chat";
  const isProfilePage = pathname === "/profile";

  const withProfileProviders = (content: React.ReactNode) => (
    <InsightPanelProvider>
      <AnalyticsPanelProvider>
        <BadgesPanelProvider>
          <FeedbackPanelProvider>{content}</FeedbackPanelProvider>
        </BadgesPanelProvider>
      </AnalyticsPanelProvider>
    </InsightPanelProvider>
  );

  return (
    <LoadingProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BadgesAwardsProvider>
            {!isChatPage && <Header />}
            <main>{isProfilePage ? withProfileProviders(children) : children}</main>
            {!isChatPage && <BadgeAwardsModal />}
            <Spinner />
            <ToastContainer position="bottom-center" autoClose={3000} hideProgressBar={true} />
          </BadgesAwardsProvider>
        </QueryClientProvider>
      </AuthProvider>
    </LoadingProvider>
  );
}
