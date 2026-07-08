import { lazy, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { KeyboardShortcutsDialog } from "./components/foxhole/KeyboardShortcutsDialog";

// The home feed loads eagerly (it's the most common entry point);
// every other page is code-split into its own chunk via React.lazy.
// The <Suspense> boundary lives in App.tsx.
import Index from "./pages/Index";

const Popular = lazy(() => import("./pages/Popular"));
const Search = lazy(() => import("./pages/Search"));
const Den = lazy(() => import("./pages/Den"));
const Post = lazy(() => import("./pages/Post"));
const NIP19Page = lazy(() => import("./pages/NIP19Page").then(m => ({ default: m.NIP19Page })));
const Comment = lazy(() => import("./pages/Comment"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const CreateDen = lazy(() => import("./pages/CreateDen"));
const Dens = lazy(() => import("./pages/Dens"));
const Discover = lazy(() => import("./pages/Discover"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Following = lazy(() => import("./pages/Following"));

// Documentation pages
const DocsIndex = lazy(() => import("./pages/docs/DocsIndex"));
const DocsTechnical = lazy(() => import("./pages/docs/DocsTechnical"));
const DocsAbout = lazy(() => import("./pages/docs/DocsAbout"));

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
