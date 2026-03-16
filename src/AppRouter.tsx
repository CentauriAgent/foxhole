import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "./components/foxhole/KeyboardShortcutsDialog";

import Index from "./pages/Index";
import Popular from "./pages/Popular";
import Search from "./pages/Search";
import Den from "./pages/Den";
import Post from "./pages/Post";
import { NIP19Page } from "./pages/NIP19Page";
import Comment from "./pages/Comment";
import CreatePost from "./pages/CreatePost";
import CreateDen from "./pages/CreateDen";
import Dens from "./pages/Dens";
import Discover from "./pages/Discover";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Bookmarks from "./pages/Bookmarks";
import Following from "./pages/Following";

// Documentation pages
import DocsIndex from "./pages/docs/DocsIndex";
import DocsTechnical from "./pages/docs/DocsTechnical";
import DocsAbout from "./pages/docs/DocsAbout";

/** Global keyboard shortcuts wrapper (must be inside BrowserRouter) */
function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  useKeyboardShortcuts({ onShowHelp: () => setHelpOpen(true) });

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <KeyboardShortcutsProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/popular" element={<Popular />} />
        <Route path="/following" element={<Following />} />
        <Route path="/dens" element={<Dens />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/search" element={<Search />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/create-den" element={<CreateDen />} />
        <Route path="/d/:den" element={<Den />} />
        <Route path="/d/:den/post/:eventId" element={<Post />} />
        <Route path="/d/:den/comment/:eventId" element={<Comment />} />
        {/* Documentation routes */}
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/technical" element={<DocsTechnical />} />
        <Route path="/docs/about" element={<DocsAbout />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </KeyboardShortcutsProvider>
    </BrowserRouter>
  );
}
export default AppRouter;
