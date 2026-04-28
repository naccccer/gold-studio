import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="secondary" size="sm">
        خروج
      </Button>
    </form>
  );
}
