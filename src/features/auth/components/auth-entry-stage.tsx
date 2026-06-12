"use client";

import Image from "next/image";
import { useActionState, useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft } from "vuesax-icons-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { LoginFormContent, SignupFormContent } from "@/features/auth/components/auth-form";
import type { AuthFormState, OtpFormState } from "@/features/auth/actions";

type AuthPanel = "login" | "signup";

type AuthEntryStageProps = {
  loginAction: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  sendSignupAction: (prevState: OtpFormState, formData: FormData) => Promise<OtpFormState>;
  verifySignupAction: (prevState: OtpFormState, formData: FormData) => Promise<OtpFormState>;
  initialPanel?: AuthPanel | null;
};

type DragState = {
  pointerId: number;
  originX: number;
  lastX: number;
  lastT: number;
  velocity: number;
};

const INITIAL_AUTH_STATE: AuthFormState = {};
const INITIAL_OTP_STATE: OtpFormState = { step: "phone" };

// فاصله خروج مدال نسبت به عرض صحنه؛ بالاتر از ۰٫۵ یعنی کارت کامل از کادر بیرون می‌رود
const COMMIT_PROGRESS = 0.62;
const ARM_THRESHOLD = 0.55;
const FLICK_VELOCITY = 0.6;
const FALLBACK_HALF_WIDTH = 196;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function easeOutQuint(t: number) {
  return 1 - (1 - t) ** 5;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function DirectionChevrons({ reverse = false }: { reverse?: boolean }) {
  return (
    <span
      dir="ltr"
      aria-hidden="true"
      className={["ov-chevrons flex items-center gap-1", reverse ? "ov-chevrons-reverse" : ""].join(" ")}
    >
      {[0, 1, 2].map((index) => (
        <svg
          key={index}
          viewBox="0 0 8 12"
          fill="none"
          className={["ov-chevron h-3.5 w-2.5", reverse ? "-scale-x-100" : ""].join(" ")}
        >
          <path d="M2 1l4.2 5L2 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

export function AuthEntryStage({
  loginAction,
  sendSignupAction,
  verifySignupAction,
  initialPanel = null,
}: AuthEntryStageProps) {
  const [panel, setPanel] = useState<AuthPanel | null>(initialPanel);
  const [commit, setCommit] = useState<AuthPanel | null>(initialPanel);
  const [closing, setClosing] = useState(false);
  const [swapDir, setSwapDir] = useState<AuthPanel | null>(null);

  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, INITIAL_AUTH_STATE);
  const [sendState, sendFormAction, sendPending] = useActionState(sendSignupAction, INITIAL_OTP_STATE);
  const [verifyState, verifyFormAction, verifyPending] = useActionState(verifySignupAction, INITIAL_OTP_STATE);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const loginZoneRef = useRef<HTMLButtonElement | null>(null);
  const signupZoneRef = useRef<HTMLButtonElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const currentXRef = useRef(0);
  const pendingXRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const tweenRef = useRef<number | null>(null);
  const panelRef = useRef(panel);
  const closingRef = useRef(false);

  const titleId = useId();

  useEffect(() => {
    panelRef.current = panel;
  }, [panel]);

  const applyVars = useCallback((x: number) => {
    currentXRef.current = x;
    const stage = stageRef.current;
    if (!stage) return;
    const half = stage.offsetWidth / 2 || FALLBACK_HALF_WIDTH;
    const progress = clamp(x / half, -1.6, 1.6);
    stage.style.setProperty("--drag-x", `${x}px`);
    stage.style.setProperty("--drag-p", progress.toFixed(4));
    stage.style.setProperty("--drag-abs", Math.min(Math.abs(progress), 1).toFixed(4));
    const dir = progress > 0.08 ? "right" : progress < -0.08 ? "left" : "none";
    if (stage.getAttribute("data-dir") !== dir) stage.setAttribute("data-dir", dir);
    const armed = progress >= ARM_THRESHOLD ? "login" : progress <= -ARM_THRESHOLD ? "signup" : "none";
    if (stage.getAttribute("data-armed") !== armed) stage.setAttribute("data-armed", armed);
  }, []);

  const scheduleVars = useCallback(
    (x: number) => {
      pendingXRef.current = x;
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (pendingXRef.current !== null) applyVars(pendingXRef.current);
        pendingXRef.current = null;
      });
    },
    [applyVars],
  );

  const cancelTween = useCallback(() => {
    if (tweenRef.current !== null) {
      window.cancelAnimationFrame(tweenRef.current);
      tweenRef.current = null;
    }
  }, []);

  const tweenTo = useCallback(
    (target: number, duration: number, ease: (t: number) => number) => {
      cancelTween();
      const from = currentXRef.current;
      if (from === target) return;
      const start = performance.now();
      const step = (now: number) => {
        const t = clamp((now - start) / duration, 0, 1);
        applyVars(from + (target - from) * ease(t));
        tweenRef.current = t < 1 ? window.requestAnimationFrame(step) : null;
      };
      tweenRef.current = window.requestAnimationFrame(step);
    },
    [applyVars, cancelTween],
  );

  const commitTargetX = useCallback((target: AuthPanel) => {
    const width = stageRef.current?.offsetWidth ?? FALLBACK_HALF_WIDTH * 2;
    return (target === "login" ? 1 : -1) * width * COMMIT_PROGRESS;
  }, []);

  const openPanel = useCallback(
    (target: AuthPanel) => {
      if (panelRef.current || closingRef.current) return;
      cancelTween();
      setCommit(target);
      setPanel(target);
      setSwapDir(null);
      if (prefersReducedMotion()) applyVars(commitTargetX(target));
      else tweenTo(commitTargetX(target), 260, easeOutCubic);
    },
    [applyVars, cancelTween, commitTargetX, tweenTo],
  );

  const closePanel = useCallback(() => {
    if (!panelRef.current || closingRef.current) return;
    const returnFocus = panelRef.current === "login" ? loginZoneRef.current : signupZoneRef.current;
    const finish = () => {
      closingRef.current = false;
      setPanel(null);
      setClosing(false);
      setCommit(null);
      setSwapDir(null);
      if (prefersReducedMotion()) applyVars(0);
      else tweenTo(0, 380, easeOutQuint);
      returnFocus?.focus({ preventScroll: true });
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(finish, 190);
  }, [applyVars, tweenTo]);

  const switchPanel = useCallback(
    (target: AuthPanel) => {
      if (panelRef.current === target || closingRef.current) return;
      setPanel(target);
      setCommit(target);
      setSwapDir(target);
      applyVars(commitTargetX(target));
    },
    [applyVars, commitTargetX],
  );

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (panelRef.current || closingRef.current || prefersReducedMotion()) return;
      cancelTween();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        originX: event.clientX - currentXRef.current,
        lastX: event.clientX,
        lastT: event.timeStamp,
        velocity: 0,
      };
      stageRef.current?.setAttribute("data-dragging", "true");
    },
    [cancelTween],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const stage = stageRef.current;
      if (!drag || !stage || event.pointerId !== drag.pointerId) return;
      const half = stage.offsetWidth / 2 || FALLBACK_HALF_WIDTH;
      const x = clamp(event.clientX - drag.originX, -half * 1.05, half * 1.05);
      const dt = event.timeStamp - drag.lastT;
      if (dt > 0) {
        const velocity = (event.clientX - drag.lastX) / dt;
        drag.velocity = drag.velocity * 0.3 + velocity * 0.7;
        drag.lastX = event.clientX;
        drag.lastT = event.timeStamp;
      }
      scheduleVars(x);
    },
    [scheduleVars],
  );

  const onPointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragRef.current = null;
      const stage = stageRef.current;
      stage?.removeAttribute("data-dragging");
      if (pendingXRef.current !== null) {
        applyVars(pendingXRef.current);
        pendingXRef.current = null;
      }
      const half = stage ? stage.offsetWidth / 2 || FALLBACK_HALF_WIDTH : FALLBACK_HALF_WIDTH;
      const progress = currentXRef.current / half;
      if (progress >= ARM_THRESHOLD || drag.velocity >= FLICK_VELOCITY) openPanel("login");
      else if (progress <= -ARM_THRESHOLD || drag.velocity <= -FLICK_VELOCITY) openPanel("signup");
      else tweenTo(0, 320, easeOutQuint);
    },
    [applyVars, openPanel, tweenTo],
  );

  useEffect(() => {
    if (!initialPanel) return;
    applyVars(commitTargetX(initialPanel));
  }, [applyVars, commitTargetX, initialPanel]);

  useEffect(() => {
    if (!panel) return;
    const sheet = sheetRef.current;
    sheet?.focus({ preventScroll: true });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePanel();
        return;
      }
      if (event.key !== "Tab" || !sheet) return;
      const focusable = Array.from(
        sheet.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === sheet)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panel, closePanel]);

  useEffect(
    () => () => {
      cancelTween();
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    },
    [cancelTween],
  );

  return (
    <main className="flex min-h-svh justify-center overflow-hidden bg-[#eee5d8] text-right text-foreground md:bg-[radial-gradient(circle_at_top,#fffaf3_0%,#f5efe5_48%,#e7dccc_100%)] md:py-6">
      <section className="relative isolate flex min-h-svh w-full max-w-[430px] flex-col overflow-hidden md:min-h-[820px] md:rounded-[1.5rem] md:border md:border-white/75 md:shadow-[0_18px_42px_-32px_rgba(23,20,17,0.62)]">
        <div ref={stageRef} className="ov-stage relative flex flex-1 flex-col" data-commit={commit ?? undefined}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="ov-cyclorama absolute inset-0" />
            <div className="ov-floor" />
            <div className="ov-parallax absolute inset-0">
              <div className="ov-pool" />
            </div>
            <div className="ov-grain absolute inset-0" />
            <div className="ov-sweepband" />
          </div>

          <header className="relative z-10 flex justify-center pt-8">
            <BrandLogo variant="primary" priority />
          </header>

          <div className="ov-scene relative z-10 flex flex-1 items-center justify-center">
            <button
              type="button"
              ref={signupZoneRef}
              onClick={() => openPanel("signup")}
              className="ov-dir-zone ov-dir-signup"
            >
              <span className="text-[0.95rem] font-bold leading-6">ثبت‌نام</span>
              <DirectionChevrons reverse />
            </button>

            <button
              type="button"
              ref={loginZoneRef}
              onClick={() => openPanel("login")}
              className="ov-dir-zone ov-dir-login"
            >
              <span className="text-[0.95rem] font-bold leading-6">ورود</span>
              <DirectionChevrons />
            </button>

            <div
              aria-hidden="true"
              className="ov-medallion-grip relative z-10 select-none"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
            >
              <div className="ov-contact-shadow" />
              <div className="ov-medallion-track">
                <div className="ov-medallion-float">
                  <div className="ov-medallion">
                    <div className="ov-medallion-side" />
                    <div className="ov-medallion-face flex items-center justify-center">
                      <Image
                        src="/brand/ovala-mark.svg"
                        alt=""
                        width={78}
                        height={86}
                        draggable={false}
                        className="opacity-85"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 pb-9 text-center text-[0.8rem] font-semibold text-muted-strong">
            <span className="ov-hint-drag">کارت را به یک سمت بکشید</span>
            <span className="ov-hint-tap">ورود یا ثبت‌نام را انتخاب کنید</span>
          </p>
        </div>

        {panel ? (
          <>
            <button
              type="button"
              aria-label="بستن"
              onClick={closePanel}
              className={["ov-scrim absolute inset-0 z-30 cursor-default bg-[#171411]/25", closing ? "ov-scrim-leave" : ""].join(" ")}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              ref={sheetRef}
              className={[
                "ov-sheet absolute inset-x-0 bottom-0 z-40 max-h-[calc(100svh-2.5rem)] overflow-y-auto rounded-t-[var(--radius-2xl)] border-t border-white/85 bg-surface/98 px-5 pt-4 shadow-[0_-18px_48px_-30px_rgba(23,20,17,0.6)] outline-none",
                "pb-[max(1.25rem,env(safe-area-inset-bottom))]",
                closing ? "ov-sheet-leave" : "",
              ].join(" ")}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h1 id={titleId} className="text-right text-[1.2rem] font-semibold leading-8 text-foreground">
                  {panel === "login" ? "ورود" : "ثبت‌نام"}
                </h1>
                <button
                  type="button"
                  onClick={closePanel}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted transition hover:bg-surface-soft hover:text-foreground focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                >
                  بازگشت
                  <ArrowLeft aria-hidden="true" size={14} color="currentColor" variant="Linear" />
                </button>
              </div>

              <div
                key={panel}
                className={swapDir ? (swapDir === "login" ? "ov-swap-from-right" : "ov-swap-from-left") : undefined}
              >
                {panel === "login" ? (
                  <LoginFormContent action={loginFormAction} state={loginState} pending={loginPending} />
                ) : (
                  <SignupFormContent
                    sendAction={sendFormAction}
                    verifyAction={verifyFormAction}
                    sendState={sendState}
                    verifyState={verifyState}
                    sendPending={sendPending}
                    verifyPending={verifyPending}
                  />
                )}

                <p className="mt-4 border-t border-border/60 pt-3 text-center text-xs font-semibold text-muted">
                  {panel === "login" ? (
                    <>
                      حساب ندارید؟{" "}
                      <button
                        type="button"
                        onClick={() => switchPanel("signup")}
                        className="text-foreground transition hover:text-accent-deep focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                      >
                        ثبت‌نام
                      </button>
                    </>
                  ) : (
                    <>
                      حساب دارید؟{" "}
                      <button
                        type="button"
                        onClick={() => switchPanel("login")}
                        className="text-foreground transition hover:text-accent-deep focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                      >
                        ورود
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
