"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/login-form";

type State = { error?: string; done?: string };

/**
 * The account's settings, as a list you open one row at a time.
 *
 * Name, email and password are three jobs with the same shape — show what it
 * is now, offer to change it, ask for the password, report back — so they are
 * three rows rather than three cards side by side. The rows are native
 * <details> in one named group, which means only one is open at a time, the
 * forms keep what has been typed while they are closed, and none of it needs
 * JavaScript to open.
 *
 * All three ask for the current password. The name and the email are what a
 * certificate is issued to and kept under; changing either is as sensitive as
 * changing the password itself.
 */
export function ProfileForms({
    name,
    email,
}: {
    name: string;
    email: string;
}) {
    const router = useRouter();

    const [newName, setNewName] = useState(name);
    const [namePw, setNamePw] = useState("");
    const [nameState, setNameState] = useState<State>({});
    const [nameBusy, setNameBusy] = useState(false);

    const [newEmail, setNewEmail] = useState("");
    const [emailPw, setEmailPw] = useState("");
    const [emailState, setEmailState] = useState<State>({});
    const [emailBusy, setEmailBusy] = useState(false);

    const [currentPw, setCurrentPw] = useState("");
    const [nextPw, setNextPw] = useState("");
    const [pwState, setPwState] = useState<State>({});
    const [pwBusy, setPwBusy] = useState(false);

    async function post(payload: Record<string, string>): Promise<State> {
        const res = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const raw = await res.text();
        try {
            const body = JSON.parse(raw) as {
                error?: string;
                changed?: string;
                email?: string;
                name?: string;
            };
            if (!res.ok) {
                return { error: body.error ?? `Failed (HTTP ${res.status}).` };
            }
            if (body.changed === "name") {
                return { done: `Name changed to ${body.name}.` };
            }
            if (body.changed === "email") {
                return { done: `Email address changed to ${body.email}.` };
            }
            return { done: "Password changed." };
        } catch {
            return { error: `Failed (HTTP ${res.status}).` };
        }
    }

    async function send(
        payload: Record<string, string>,
        set: (s: State) => void,
        setBusy: (b: boolean) => void,
        after?: () => void,
    ) {
        set({});
        setBusy(true);
        try {
            const result = await post(payload);
            set(result);
            if (result.done) after?.();
        } catch {
            set({
                error: navigator.onLine
                    ? "The request did not reach the server."
                    : "This device has no internet connection.",
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="card-stock overflow-hidden border-t-2 border-ink">
            {/* ── name ── */}
            <Row label="Name" value={name}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void send(
                            { action: "name", name: newName, password: namePw },
                            setNameState,
                            setNameBusy,
                            () => {
                                setNamePw("");
                                router.refresh();
                            },
                        );
                    }}
                    className="space-y-4"
                >
                    <Field
                        label="New name"
                        value={newName}
                        onChange={setNewName}
                        autoComplete="name"
                        required
                    />
                    <Field
                        label="Your password"
                        value={namePw}
                        onChange={setNamePw}
                        type="password"
                        autoComplete="current-password"
                        required
                    />
                    <Notice state={nameState} />
                    <Button type="submit" disabled={nameBusy} className="w-full">
                        {nameBusy ? "Changing…" : "Save name"}
                    </Button>
                    <p className="text-[13px] text-muted-foreground">
                        This is the name a certificate is issued to.
                    </p>
                </form>
            </Row>

            {/* ── email ── */}
            <Row label="Email" value={email}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void send(
                            { action: "email", email: newEmail, password: emailPw },
                            setEmailState,
                            setEmailBusy,
                            () => {
                                setNewEmail("");
                                setEmailPw("");
                                router.refresh();
                            },
                        );
                    }}
                    className="space-y-4"
                >
                    <Field
                        label="New email address"
                        value={newEmail}
                        onChange={setNewEmail}
                        type="email"
                        placeholder="name@example.org"
                        autoComplete="email"
                        required
                    />
                    <Field
                        label="Your password"
                        value={emailPw}
                        onChange={setEmailPw}
                        type="password"
                        autoComplete="current-password"
                        required
                    />
                    <Notice state={emailState} />
                    <Button type="submit" disabled={emailBusy} className="w-full">
                        {emailBusy ? "Changing…" : "Save email address"}
                    </Button>
                    <p className="text-[13px] text-muted-foreground">
                        Every certificate is kept under this address.
                    </p>
                </form>
            </Row>

            {/* ── password ── */}
            <Row label="Password" value="••••••••">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void send(
                            { action: "password", current: currentPw, next: nextPw },
                            setPwState,
                            setPwBusy,
                            () => {
                                setCurrentPw("");
                                setNextPw("");
                            },
                        );
                    }}
                    className="space-y-4"
                >
                    <Field
                        label="Current password"
                        value={currentPw}
                        onChange={setCurrentPw}
                        type="password"
                        autoComplete="current-password"
                        required
                    />
                    <Field
                        label="New password"
                        value={nextPw}
                        onChange={setNextPw}
                        type="password"
                        autoComplete="new-password"
                        required
                    />
                    <Notice state={pwState} />
                    <Button type="submit" disabled={pwBusy} className="w-full">
                        {pwBusy ? "Changing…" : "Save password"}
                    </Button>
                </form>
            </Row>
        </div>
    );
}

/**
 * One settings row: what it is now on the left, Change on the right, and the
 * form underneath once it is open.
 *
 * `name` on the <details> makes the three an accordion, so opening the email
 * closes the password — one job on screen at a time.
 */
function Row({
    label,
    value,
    children,
}: {
    label: string;
    value: string;
    children: ReactNode;
}) {
    return (
        <details
            name="profile-edit"
            className="group border-b border-border last:border-b-0"
        >
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                <span className="label w-20 shrink-0">{label}</span>
                <span className="min-w-0 flex-1 truncate text-[15px] text-ink">
                    {value}
                </span>
                <span className="shrink-0 text-[12px] tracking-[.08em] uppercase text-bt-red">
                    <span className="group-open:hidden">Change</span>
                    <span className="hidden group-open:inline">Close</span>
                </span>
                <span
                    aria-hidden
                    className="shrink-0 text-ink-3 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180 motion-reduce:transition-none"
                >
                    ↓
                </span>
            </summary>

            <div className="bg-muted/40 px-5 pt-3 pb-5">
                <div className="max-w-sm">{children}</div>
            </div>
        </details>
    );
}

function Notice({ state }: { state: State }) {
    if (!state.error && !state.done) return null;
    return (
        <p
            role={state.error ? "alert" : "status"}
            className={
                state.error
                    ? "bg-bt-red/6 p-3 text-[15px] text-bt-red shadow-[inset_0_0_0_1px_rgba(174,24,0,.28)]"
                    : "bg-success/8 p-3 text-[15px] text-success shadow-[inset_0_0_0_1px_rgba(62,107,46,.25)]"
            }
        >
            {state.error ?? state.done}
        </p>
    );
}