"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/copy";

type Mode = "login" | "register";

/* Mirrors app/api/auth/route.ts, so the rule is said before it is broken. */
const MIN_PASSWORD = 8;

/**
 * Sign in, or make an account.
 *
 * One form with two modes, switched by a control at the top rather than a link
 * at the bottom: a visitor who arrived from "Create an account" should see the
 * account form, and one who guessed the wrong mode should not have to read to
 * the end to find the other one. The password can be shown — on a phone,
 * typing one blind is where most sign-ups fail.
 *
 * On success it goes back to where the visitor came from (a record they were
 * about to claim), or to their traces.
 */
export default function LoginForm({
    next,
    initialMode = "login",
}: {
    next?: string;
    initialMode?: Mode;
}) {
    const router = useRouter();
    const [mode, setMode] = useState<Mode>(initialMode);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [outlet, setOutlet] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/collection";
    const register = mode === "register";

    function switchTo(value: Mode) {
        setMode(value);
        setError(null);
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault();
        setError(null);

        if (register && password.length < MIN_PASSWORD) {
            setError(`Use at least ${MIN_PASSWORD} characters for the password.`);
            return;
        }

        setBusy(true);
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    register
                        ? { action: "register", name, email, password, outlet }
                        : { action: "login", email, password },
                ),
            });

            /* Read as text first, so a server message (a missing signing
               secret, a storage problem) reaches the screen. */
            const raw = await res.text();
            let body: { error?: string } = {};
            try {
                body = JSON.parse(raw) as typeof body;
            } catch {
                body = {};
            }

            if (!res.ok) {
                setError(body.error ?? `Could not sign in (HTTP ${res.status}).`);
                return;
            }

            router.push(target);
            router.refresh();
        } catch {
            setError(
                navigator.onLine
                    ? "The request did not reach the server. Try again in a moment."
                    : "This phone has no internet connection.",
            );
        } finally {
            setBusy(false);
        }
    }

    return (
        <div>
            <div
                role="group"
                aria-label="Sign in or create an account"
                className="grid grid-cols-2 gap-1 bg-muted p-1"
            >
                {(
                    [
                        ["login", "Sign in"],
                        ["register", "Create account"],
                    ] as const
                ).map(([value, label]) => {
                    const on = mode === value;
                    return (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={on}
                            onClick={() => switchTo(value)}
                            className="pressable relative h-11 text-[15px]"
                        >
                            {on && (
                                <motion.span
                                    layoutId="auth-mode"
                                    aria-hidden
                                    className="absolute inset-0 bg-ink"
                                    transition={{ type: "spring", duration: 0.3, bounce: 0.12 }}
                                />
                            )}
                            <span className={`relative ${on ? "text-white" : "text-ink-2 hover:text-ink"}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
                {register && (
                    <Field
                        label={t.claimName}
                        value={name}
                        onChange={setName}
                        placeholder="As it should appear on a certificate"
                        autoComplete="name"
                        required
                        hint="The name each certificate is issued to."
                    />
                )}

                <Field
                    label={t.claimEmail}
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.org"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                />

                <Field
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    type="password"
                    autoComplete={register ? "new-password" : "current-password"}
                    required
                    minLength={register ? MIN_PASSWORD : undefined}
                    hint={register ? `At least ${MIN_PASSWORD} characters.` : undefined}
                />

                {register && (
                    <Field
                        label={t.claimOutlet}
                        value={outlet}
                        onChange={setOutlet}
                        placeholder="Foundation, studio, shop"
                        autoComplete="organization"
                    />
                )}

                {error && (
                    <p
                        role="alert"
                        className="bg-bt-red/6 p-3 text-[15px] text-bt-red shadow-[inset_0_0_0_1px_rgba(174,24,0,.28)]"
                    >
                        {error}
                    </p>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                    {busy
                        ? register
                            ? "Creating your account…"
                            : "Signing in…"
                        : register
                          ? "Create account"
                          : t.signInButton}
                </Button>

                <p className="text-center text-[14px] text-muted-foreground">
                    {register ? "Already have an account? " : "New here? "}
                    <button
                        type="button"
                        onClick={() => switchTo(register ? "login" : "register")}
                        className="text-bt-red underline underline-offset-2 hover:text-bt-red-bright"
                    >
                        {register ? "Sign in" : "Create an account"}
                    </button>
                </p>
            </form>
        </div>
    );
}

export function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    required,
    autoComplete,
    name,
    hint,
    inputMode,
    minLength,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    autoComplete?: string;
    name?: string;
    hint?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    minLength?: number;
}) {
    const id = useId();
    const [shown, setShown] = useState(false);
    const secret = type === "password";

    return (
        <div>
            <label htmlFor={id} className="label">
                {label}
            </label>
            <div className="relative mt-1.5">
                <input
                    id={id}
                    type={secret && shown ? "text" : type}
                    name={name}
                    required={required}
                    value={value}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    minLength={minLength}
                    aria-describedby={hint ? `${id}-hint` : undefined}
                    onChange={(e) => onChange(e.target.value)}
                    className={`h-12 w-full bg-white px-3.5 text-[16px] shadow-[var(--shadow-field)] transition-shadow duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-ink-3 focus-visible:shadow-[inset_0_0_0_2px_var(--bt-ink)] focus-visible:outline-none ${
                        secret ? "pr-12" : ""
                    }`}
                />
                {secret && (
                    <button
                        type="button"
                        onClick={() => setShown((v) => !v)}
                        aria-label={shown ? "Hide password" : "Show password"}
                        aria-pressed={shown}
                        className="absolute top-1/2 right-1.5 grid h-9 w-9 -translate-y-1/2 place-items-center text-ink-3 hover:bg-ink/5 hover:text-ink"
                    >
                        {shown ? (
                            <EyeOff aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        ) : (
                            <Eye aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        )}
                    </button>
                )}
            </div>
            {hint && (
                <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
}
