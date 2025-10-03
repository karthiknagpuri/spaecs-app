import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";

export default function AuthDemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Spaecs
        </h1>
        <p className="text-gray-600 mb-8">
          Sign in to get started
        </p>
        <GoogleAuthButton />
      </div>
    </div>
  );
}
