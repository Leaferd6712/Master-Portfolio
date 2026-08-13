import { redirect } from "next/navigation";

export default function AllTasksRedirectPage() {
  redirect("/dashboard/tasks?view=list");
}
