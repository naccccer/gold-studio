import { createProjectAction } from "@/features/projects/actions";
import { NewProjectScreen } from "@/features/projects/screens/new-project-screen";
import { requireUserSession } from "@/lib/auth/session";

export default async function NewProjectPage() {
  await requireUserSession();

  return <NewProjectScreen action={createProjectAction} />;
}
