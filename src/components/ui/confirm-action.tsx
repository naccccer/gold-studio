"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type ConfirmActionField = { name: string; value: string };

type ConfirmActionProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: ConfirmActionField[];
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  trigger: ReactNode | ((open: () => void) => ReactNode);
  destructive?: boolean;
};

export function ConfirmAction({
  action,
  fields,
  title,
  description,
  confirmLabel = "تایید حذف",
  cancelLabel = "انصراف",
  trigger,
  destructive = true,
}: ConfirmActionProps) {
  const [open, setOpen] = useState(false);
  const triggerNode = typeof trigger === "function" ? trigger(() => setOpen(true)) : trigger;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerNode}</DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[var(--r-pill)] bg-danger-soft text-danger">
            {destructive ? <Trash2 aria-hidden className="h-4.5 w-4.5" strokeWidth={2} /> : <AlertTriangle aria-hidden className="h-4.5 w-4.5" strokeWidth={2} />}
          </div>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <form action={action} className="contents">
          {fields.map((field, i) => (
            <input key={`${field.name}-${field.value}-${i}`} type="hidden" name={field.name} value={field.value} />
          ))}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" size="lg" fullWidth>{cancelLabel}</Button>
            </DialogClose>
            <Button type="submit" variant={destructive ? "danger" : "primary"} size="lg" fullWidth>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
