import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import AppSidebar from "@/components/AppSidebar"
import { UserButton } from '@clerk/nextjs'
import { ModeToggle } from '@/components/ModeToggle'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="sticky top-0 z-10 flex items-center justify-between h-16 px-6 border-b border-gray-800 bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>
          <div className='flex items-center gap-4'>
            <ModeToggle />
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9"
                }
              }}
            />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
