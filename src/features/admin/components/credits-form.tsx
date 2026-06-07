import { Save } from "lucide-react";
import { updateUserCreditsAction } from "@/features/admin/actions";
import { adminInputClass, adminPrimaryActionClass } from "@/features/admin/components/admin-ui";

type CreditsFormProps = {
  userId: string;
  credits: number;
};

export function CreditsForm({ userId, credits }: CreditsFormProps) {
  return (
    <form action={updateUserCreditsAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <input
        name="credits"
        type="number"
        min={0}
        defaultValue={credits}
        aria-label="اعتبار"
        className={`${adminInputClass} w-20 px-2`}
      />
      <button
        type="submit"
        className={adminPrimaryActionClass}
      >
        <Save aria-hidden="true" className="h-3.5 w-3.5" />
        ذخیره
      </button>
    </form>
  );
}
