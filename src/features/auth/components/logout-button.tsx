import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className="border border-border bg-surface-soft text-muted hover:border-border-strong hover:text-foreground">
        خروج
      </Button>
    </form>
  );
}
