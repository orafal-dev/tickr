import { OrganizationManagementView } from "@/app/dashboard/organization/organization-management-view"
import { getSession } from "@/lib/auth"

export default async function OrganizationPage() {
  const session = await getSession()
  if (!session) {
    return null
  }

  return <OrganizationManagementView />
}
