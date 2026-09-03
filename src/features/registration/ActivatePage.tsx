import { KeyRound, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { blocksClient } from "../../lib/blocks/client";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { FormField } from "../../shared/ui/FormField";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";

type ValidateState = "checking" | "valid" | "invalid";

export function ActivatePage({ code, onNavigate }: { code: string | undefined; onNavigate: (path: string) => void }) {
  const { t } = useT();
  const [validity, setValidity] = useState<ValidateState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [resent, setResent] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!code) {
      setValidity("invalid");
      return;
    }
    blocksClient.auth.validateActivation({ code }).then(
      (state) => setValidity((state as { valid?: boolean }).valid === false ? "invalid" : "valid"),
      () => setValidity("invalid")
    );
  }, [code]);

  async function handleResend() {
    if (!code) return;
    try {
      await blocksClient.auth.resendActivation({ code });
      setResent(true);
    } catch {
      // Silently ignored -- resend is best-effort; the user can retry.
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);

    if (password.length < 8) {
      setError(t("activate.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("activate.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      await blocksClient.auth.activate({ code, password });
      setDone(true);
    } catch (caught) {
      setError((caught as Error).message || t("activate.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (validity === "checking") return <LoadingScreen />;

  if (validity === "invalid") {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>{t("activate.expiredTitle")}</span></div>
          <Alert tone="error">{t("activate.expiredBody")}</Alert>
          {resent ? (
            <Alert tone="info">{t("activate.resent")}</Alert>
          ) : (
            <button className="primary-button auth-submit" onClick={handleResend}>{t("activate.resend")}</button>
          )}
          <button className="icon-button auth-submit" onClick={() => onNavigate("/register")}>{t("activate.backToRegister")}</button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark"><ShieldCheck size={18} /></span><span>{t("activate.doneTitle")}</span></div>
          <p>{t("activate.doneBody")}</p>
          <button className="primary-button auth-submit" onClick={() => onNavigate("/login")}>{t("activate.goToLogin")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand"><span className="brand-mark"><KeyRound size={18} /></span><span>{t("activate.title")}</span></div>
        <p>{t("activate.subtitle")}</p>
        {error ? <Alert tone="error">{error}</Alert> : null}
        <FormField
          label={t("activate.password")}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <FormField
          label={t("activate.confirmPassword")}
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>
          {submitting ? t("activate.submitting") : t("activate.submit")}
        </button>
      </form>
    </div>
  );
}
