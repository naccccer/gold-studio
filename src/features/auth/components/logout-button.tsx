import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className="h-11 w-full border border-border/80 bg-surface px-3 text-danger hover:bg-danger-soft hover:text-danger">
        <LogOut aria-hidden="true" className="h-4 w-4" />
        خروج
      </Button>
    </form>
  );
}
