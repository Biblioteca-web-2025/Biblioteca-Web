import { AuthWrapper } from "@/components/auth-wrapper"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  )
}
