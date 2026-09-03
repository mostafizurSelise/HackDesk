import { Check, Clock3 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useHasPermission } from "../access/usePermission";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Alert } from "../../shared/ui/Alert";
import { ActionButton } from "../../shared/ui/ActionButton";
import { DataTable, type Column } from "../../shared/ui/DataTable";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";
import { PageHeader } from "../../shared/ui/PageHeader";
import { StatusPill } from "../../shared/ui/StatusPill";
import { listRegistrations, setRegistrationStatus, type Registration } from "./registrationApi";

const STATUS_TONE = { approved: "good", submitted: "neutral", waitlisted: "warn" } as const;

export function OrganizerConsolePage() {
  const { t } = useT();
  const canReview = useHasPermission("registration::review");
  const queryClient = useQueryClient();
  const registrationsQuery = useQuery({ enabled: canReview, queryFn: listRegistrations, queryKey: ["registrations", "all"] });

  const statusMutation = useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: "approved" | "waitlisted" }) => setRegistrationStatus(itemId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["registrations", "all"] })
  });

  if (!canReview) {
    return (
      <section>
        <PageHeader title={t("organizer.title")} subtitle={t("organizer.subtitle")} />
        <Alert tone="warn">{t("organizer.noPermission")}</Alert>
      </section>
    );
  }

  if (registrationsQuery.isLoading) return <LoadingScreen />;

  const columns: Column<Registration>[] = [
    { header: t("organizer.colTeam"), key: "team", render: (row) => row.TeamName },
    { header: t("organizer.colName"), key: "name", render: (row) => row.FullName },
    { header: t("organizer.colEmail"), key: "email", render: (row) => row.Email },
    { header: t("organizer.colExperience"), key: "experience", render: (row) => row.ExperienceLevel },
    { header: t("organizer.colAiCli"), key: "aiCli", render: (row) => row.AiCli },
    {
      header: t("organizer.colStatus"),
      key: "status",
      render: (row) => <StatusPill tone={STATUS_TONE[row.Status as keyof typeof STATUS_TONE] ?? "neutral"}>{row.Status ?? "submitted"}</StatusPill>
    },
    {
      header: t("organizer.colActions"),
      key: "actions",
      render: (row) => (
        <div style={{ display: "flex", gap: 8 }}>
          <ActionButton
            variant="icon"
            title={t("organizer.approve")}
            disabled={statusMutation.isPending}
            onClick={() => row.itemId && statusMutation.mutate({ itemId: row.itemId, status: "approved" })}
            icon={<Check size={16} />}
          />
          <ActionButton
            variant="icon"
            title={t("organizer.waitlist")}
            disabled={statusMutation.isPending}
            onClick={() => row.itemId && statusMutation.mutate({ itemId: row.itemId, status: "waitlisted" })}
            icon={<Clock3 size={16} />}
          />
        </div>
      )
    }
  ];

  const rows = registrationsQuery.data ?? [];

  return (
    <section>
      <PageHeader title={t("organizer.title")} subtitle={`${t("organizer.subtitle")} (${rows.length})`} />
      {statusMutation.isError ? <Alert tone="error">{(statusMutation.error as Error).message}</Alert> : null}
      {rows.length === 0 ? <Alert tone="info">{t("organizer.empty")}</Alert> : <DataTable columns={columns} rows={rows} />}
    </section>
  );
}
