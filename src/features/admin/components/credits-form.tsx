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
        className="h-9 w-20 rounded-lg border border-amber-200 px-2 text-sm"
      />
      <button
        type="submit"
        className="h-9 rounded-lg bg-amber-700 px-3 text-xs font-medium text-white transition hover:bg-amber-800"
      >
        Ø°Ø®ÛŒØ±Ù‡
      </button>
    </form>
  );
}
