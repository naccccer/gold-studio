type PlaceholderPageProps = {
  title: string;
  description: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export function PlaceholderPage({
  title,
  description,
  eyebrow,
  children,
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#ffffff_42%,_#f8fafc_100%)] px-4 py-6 text-right text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col justify-center rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        {eyebrow ? (
          <p className="text-xs font-semibold tracking-[0.24em] text-amber-700">
            {eyebrow}
          </p>
        ) : null}

        <div className="mt-4 space-y-3">
          <h1 className="text-3xl font-semibold leading-tight text-slate-950">
            {title}
          </h1>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </section>
    </main>
  );
}
