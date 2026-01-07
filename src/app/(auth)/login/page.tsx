import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { LoginButton } from "@/components/auth/login-button";

export default async function LoginPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/projects");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Resource Tracker</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        <LoginButton />
      </div>
    </div>
  );
}

