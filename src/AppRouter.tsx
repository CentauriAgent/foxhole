import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import Popular from "./pages/Popular";
import Search from "./pages/Search";
import Den from "./pages/Den";
import Post from "./pages/Post";
import { NIP19Page } from "./pages/NIP19Page";
import Comment from "./pages/Comment";
import CreatePost from "./pages/CreatePost";
import NotFound from "./pages/NotFound";

// Documentation pages
import DocsIndex from "./pages/docs/DocsIndex";
import DocsTechnical from "./pages/docs/DocsTechnical";
import DocsAbout from "./pages/docs/DocsAbout";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/popular" element={<Popular />} />
        <Route path="/search" element={<Search />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/d/:den" element={<Den />} />
        <Route path="/d/:den/post/:eventId" element={<Post />} />
        <Route path="/d/:den/comment/:eventId" element={<Comment />} />
        {/* Documentation routes */}
        <Route path="/docs" element={<DocsIndex />} />
        <Route path="/docs/technical" element={<DocsTechnical />} />
        <Route path="/docs/about" element={<DocsAbout />} />
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;
