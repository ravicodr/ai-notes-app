import { redirect } from "next/navigation";

// The actual dashboard is at /notes to avoid conflicting with app/page.tsx
export default function DashboardRootPage() {
  redirect("/notes");
}
