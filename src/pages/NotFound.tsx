import { useSeoMeta } from "@unhead/react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useSeoMeta({
    title: "404 - Lost in the Foxhole",
    description: "The page you are looking for could not be found. Return to the home page to continue browsing.",
  });

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="text-6xl mb-6">🦊</div>
        <h1 className="text-4xl font-bold mb-3 text-foreground">Lost in the foxhole?</h1>
        <p className="text-xl text-muted-foreground mb-8">
          This tunnel doesn't lead anywhere. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[hsl(var(--brand))] text-[hsl(var(--brand-foreground))] font-medium hover:opacity-90 transition-opacity"
        >
          Back to the Den
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
