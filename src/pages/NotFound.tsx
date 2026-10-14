import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.warn("JagX Connect: route not found", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-5 py-12">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          <Search className="size-8" aria-hidden="true" />
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          JagX Connect
        </p>
        <h1 className="mb-3 text-5xl font-bold tracking-tight">404</h1>
        <h2 className="mb-3 text-xl font-semibold">This page couldn’t be found</h2>
        <p className="mx-auto mb-7 max-w-sm text-sm leading-6 text-muted-foreground">
          The link may be old, the address may be incorrect, or this page may have moved.
          Your account and posts are not affected.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Home className="size-4" aria-hidden="true" />
            Go to Feed
          </Link>
          <button
            type="button"
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign("/")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 font-semibold transition-colors hover:bg-muted"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go back
          </button>
        </div>
        <p className="mt-6 break-all text-xs text-muted-foreground">
          Requested path: {location.pathname}
        </p>
      </section>
    </main>
  );
};

export default NotFound;
