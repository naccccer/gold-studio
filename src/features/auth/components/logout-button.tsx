import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className = "" }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className={[
          "h-11 w-full border border-danger/30 bg-danger-soft/60 px-3 text-danger hover:bg-danger-soft hover:text-danger",
          className,
        ].join(" ")}
      >
        <LogOut aria-hidden="true" className="h-4 w-4" />
        خروج از حساب
      </Button>
    </form>
  );
}
