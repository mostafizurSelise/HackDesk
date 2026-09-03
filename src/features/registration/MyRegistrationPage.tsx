import { Save } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { FormField } from "../../shared/ui/FormField";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";
import { LogoThumbnail } from "../../shared/ui/LogoThumbnail";
import { PageHeader } from "../../shared/ui/PageHeader";
import { SelectField } from "../../shared/ui/SelectField";
import { StatusPill } from "../../shared/ui/StatusPill";
import { createRegistration, listRegistrations, updateRegistration, type RegistrationInput } from "./registrationApi";
import { uploadLogo } from "./uploadLogo";

const EXPERIENCE_OPTIONS = ["beginner", "intermediate", "advanced"];
const AI_CLI_OPTIONS = ["claude-code", "codex", "gemini-cli", "other"];
const STATUS_TONE = { approved: "good", submitted: "neutral", waitlisted: "warn" } as const;

function emptyInput(): RegistrationInput {
  return { AiCli: "claude-code", Email: "", ExperienceLevel: "beginner", FullName: "", GithubHandle: "", TeamName: "", TeammateEmails: ["", ""] };
}

export function MyRegistrationPage() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const registrationsQuery = useQuery({ queryFn: listRegistrations, queryKey: ["registrations", "mine"] });
  const mine = registrationsQuery.data?.[0];

  const [form, setForm] = useState<RegistrationInput>(emptyInput());
  const [hydrated, setHydrated] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | undefined>();

  if (mine && !hydrated) {
    setForm({
      AiCli: mine.AiCli ?? "claude-code",
      Email: mine.Email ?? "",
      ExperienceLevel: mine.ExperienceLevel ?? "beginner",
      FullName: mine.FullName ?? "",
      GithubHandle: mine.GithubHandle ?? "",
      LogoFileId: mine.LogoFileId,
      TeamName: mine.TeamName ?? "",
      TeammateEmails: [mine.TeammateEmails?.[0] ?? "", mine.TeammateEmails?.[1] ?? ""]
    });
    setHydrated(true);
  }

  const saveMutation = useMutation({
    mutationFn: (input: RegistrationInput) => {
      const teammateEmails = (input.TeammateEmails ?? []).filter(Boolean);
      const payload = { ...input, TeammateEmails: teammateEmails };
      return mine?.itemId ? updateRegistration(mine.itemId, payload) : createRegistration(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["registrations", "mine"] })
  });

  function update<K extends keyof RegistrationInput>(key: K, value: RegistrationInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateTeammate(index: number, value: string) {
    setForm((prev) => {
      const next = [...(prev.TeammateEmails ?? ["", ""])];
      next[index] = value;
      return { ...prev, TeammateEmails: next };
    });
  }

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoError(undefined);
    setLogoUploading(true);
    try {
      const fileId = await uploadLogo(file);
      update("LogoFileId", fileId);
    } catch (caught) {
      setLogoError((caught as Error).message || t("myRegistration.logoFailed"));
    } finally {
      setLogoUploading(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    saveMutation.mutate(form);
  }

  if (registrationsQuery.isLoading) return <LoadingScreen />;

  return (
    <section>
      <PageHeader
        title={t("myRegistration.title")}
        subtitle={t("myRegistration.subtitle")}
        actions={mine?.Status ? <StatusPill tone={STATUS_TONE[mine.Status as keyof typeof STATUS_TONE] ?? "neutral"}>{mine.Status}</StatusPill> : null}
      />

      {saveMutation.isError ? <Alert tone="error">{(saveMutation.error as Error).message}</Alert> : null}
      {saveMutation.isSuccess ? <Alert tone="info">{t("myRegistration.saved")}</Alert> : null}

      <form className="panel" onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        <FormField label={t("myRegistration.fullName")} value={form.FullName} onChange={(e) => update("FullName", e.target.value)} required />
        <FormField label={t("myRegistration.email")} type="email" value={form.Email} onChange={(e) => update("Email", e.target.value)} required />
        <FormField label={t("myRegistration.teamName")} value={form.TeamName} onChange={(e) => update("TeamName", e.target.value)} required />
        <FormField label={t("myRegistration.teammate1")} type="email" value={form.TeammateEmails?.[0] ?? ""} onChange={(e) => updateTeammate(0, e.target.value)} />
        <FormField label={t("myRegistration.teammate2")} type="email" value={form.TeammateEmails?.[1] ?? ""} onChange={(e) => updateTeammate(1, e.target.value)} />
        <SelectField
          label={t("myRegistration.experience")}
          value={form.ExperienceLevel}
          onChange={(e) => update("ExperienceLevel", e.target.value)}
          options={EXPERIENCE_OPTIONS.map((value) => ({ label: t(`experience.${value}` as never, value), value }))}
        />
        <SelectField
          label={t("myRegistration.aiCli")}
          value={form.AiCli}
          onChange={(e) => update("AiCli", e.target.value)}
          options={AI_CLI_OPTIONS.map((value) => ({ label: value, value }))}
        />
        <FormField label={t("myRegistration.githubHandle")} value={form.GithubHandle ?? ""} onChange={(e) => update("GithubHandle", e.target.value)} />

        <label className="form-field">
          <span>{t("myRegistration.logo")}</span>
          <input type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} />
        </label>
        {logoError ? <Alert tone="error">{logoError}</Alert> : null}
        {form.LogoFileId ? <LogoThumbnail fileId={form.LogoFileId} size={64} /> : null}

        <button className="primary-button" type="submit" disabled={saveMutation.isPending || logoUploading}>
          <Save size={16} /> {saveMutation.isPending ? t("myRegistration.saving") : t("myRegistration.save")}
        </button>
      </form>
    </section>
  );
}
