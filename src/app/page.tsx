import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await getServerSession();

  // If logged in, redirect to dashboard
  if (session) {
    redirect("/projects");
  }

  // Public landing page for Google verification
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">ResourceHub</h1>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold">ResourceHub</h1>
            <p className="text-xl text-muted-foreground">
              Internal resource tracking and management system for Digital Green Foundation
            </p>
            <p className="text-muted-foreground">
              This application is intended solely for authorized employees, contractors, and personnel 
              of Digital Green Foundation and its sister concerns.
            </p>
            <div className="pt-8">
              <Link href="/login">
                <Button size="lg">Sign In with Google</Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 border-t pt-8">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground hover:underline">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-foreground hover:underline">
                Terms of Service
              </Link>
              <span>•</span>
              <span>© {new Date().getFullYear()} Digital Green Foundation</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
