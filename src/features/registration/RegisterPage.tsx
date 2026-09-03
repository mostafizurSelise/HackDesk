import { MailCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { blocksClient } from "../../lib/blocks/client";
import { fetchCaptchaConfig } from "../../lib/blocks/captcha";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { CaptchaWidget } from "../../shared/ui/CaptchaWidget";
import { FormField } from "../../shared/ui/FormField";

type FormState = { email: string; firstName: string; lastName: string };
const EMPTY: FormState = { email: "", firstName: "", lastName: "" };

export function RegisterPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useT();
  const captchaQuery = useQuery({ queryFn: fetchCaptchaConfig, queryKey: ["captcha", "ui-config"], staleTime: 5 * 60_000 });
  const captcha = captchaQuery.data;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  const captchaRequired = Boolean(captcha);
  const canSubmit = form.email && form.firstName && form.lastName && !emailTaken && !checkingEmail
    && (!captchaRequired || Boolean(captchaToken)) && !submitting;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function checkEmail(email: string) {
    if (!email) return;
    setCheckingEmail(true);
    try {
      const availability = (await blocksClient.iam.users.emailAvailable({ email })) as Record<string, unknown>;
      const isAvailable = (availability.isAvailable ?? availability.IsAvailable) as boolean | undefined;
      setEmailTaken(isAvailable === false);
    } catch {
      // A failed check shouldn't block the form -- IAM's own signup call is
      // the authoritative check and will reject a duplicate email anyway.
      setEmailTaken(false);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      await blocksClient.auth.signup({
        captchaCode: captchaToken ?? undefined,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName
      });
      setDone(true);
    } catch (caught) {
      setError((caught as Error).message || t("register.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <div className="auth-brand"><span className="brand-mark"><MailCheck size={18} /></span><span>{t("register.checkEmailTitle")}</span></div>
          <p>{t("register.checkEmailBody")}</p>
          <button className="primary-button auth-submit" onClick={() => onNavigate("/activate")}>{t("register.haveCode")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand"><span className="brand-mark"><UserPlus size={18} /></span><span>{t("register.title")}</span></div>
        <p>{t("register.subtitle")}</p>

        {error ? <Alert tone="error">{error}</Alert> : null}
        {emailTaken ? <Alert tone="warn">{t("register.emailTaken")}</Alert> : null}

        <FormField
          label={t("register.firstName")}
          value={form.firstName}
          onChange={(event) => update("firstName", event.target.value)}
          required
        />
        <FormField
          label={t("register.lastName")}
          value={form.lastName}
          onChange={(event) => update("lastName", event.target.value)}
          required
        />
        <FormField
          label={t("register.email")}
          type="email"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          onBlur={(event) => checkEmail(event.target.value)}
          required
        />

        {captchaRequired ? (
          <CaptchaWidget siteKey={captcha!.key} onChange={setCaptchaToken} />
        ) : captchaQuery.isSuccess ? (
          <Alert tone="info">{t("register.captchaNotConfigured")}</Alert>
        ) : null}

        <button className="primary-button auth-submit" type="submit" disabled={!canSubmit}>
          {submitting ? t("register.submitting") : t("register.submit")}
        </button>

        <button type="button" className="icon-button auth-submit" onClick={() => onNavigate("/login")}>
          {t("register.alreadyHaveAccount")}
        </button>
      </form>
    </div>
  );
}
