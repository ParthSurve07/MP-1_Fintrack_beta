import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md px-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg" />
          <span className="text-2xl font-bold">FinTrack</span>
        </div>

        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-black border border-white/10 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
              formButtonPrimary: "bg-white text-black hover:bg-gray-200",
              formFieldInput: "bg-white/5 border-white/10 text-white",
              formFieldLabel: "text-gray-300",
              footerActionLink: "text-blue-400 hover:text-blue-300",
            },
          }}
        />

        <p className="text-center text-sm text-gray-500 mt-8">
          Secure authentication powered by Clerk
        </p>
      </div>
    </div>
  );
}
