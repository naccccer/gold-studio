import { Save } from "lucide-react";
import { updateUserCreditsAction } from "@/features/admin/actions";

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
        className="h-9 w-20 rounded-[var(--radius-sm)] border border-border bg-surface px-2 text-sm text-foreground outline-none focus:border-focus focus:shadow-[var(--shadow-focus)]"
      />
      <button
        type="submit"
        className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-foreground px-3 text-xs font-medium text-surface transition hover:bg-[#27231f]"
      >
        <Save aria-hidden="true" className="h-3.5 w-3.5" />
        ذخیره
      </button>
    </form>
  );
}
