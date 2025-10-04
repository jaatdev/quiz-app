import { SignIn } from '@clerk/nextjs';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = params.redirect_url || '/dashboard';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
          <p className="text-gray-600">Sign in to continue your learning journey</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl"
            }
          }}
          signUpUrl="/sign-up"
          forceRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
