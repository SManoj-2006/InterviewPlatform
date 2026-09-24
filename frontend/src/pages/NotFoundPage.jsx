import { Link } from "react-router";
import { HomeIcon, LayoutDashboardIcon } from "lucide-react";

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          404
        </p>
        <h1 className="text-2xl font-bold mt-4">Page not found</h1>
        <p className="text-base-content/60 mt-2">
          The page you&apos;re looking for doesn&apos;t exist or was moved.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <Link to="/dashboard" className="btn btn-primary gap-2">
            <LayoutDashboardIcon className="size-4" />
            Dashboard
          </Link>
          <Link to="/" className="btn btn-ghost gap-2">
            <HomeIcon className="size-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
