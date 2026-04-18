import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

export default async function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
