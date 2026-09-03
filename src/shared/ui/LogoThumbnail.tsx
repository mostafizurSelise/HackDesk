import { ImageOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLogoUrl } from "../../features/registration/uploadLogo";
import { useT } from "../../lib/i18n/LocalizationProvider";
import { Skeleton } from "./Skeleton";

export function LogoThumbnail({ fileId, size = 40 }: { fileId?: string; size?: number }) {
  const { t } = useT();
  const query = useQuery({
    enabled: Boolean(fileId),
    queryFn: () => getLogoUrl(fileId!),
    queryKey: ["logo-url", fileId]
  });

  if (!fileId) return null;
  if (query.isLoading) return <Skeleton style={{ borderRadius: 6, height: size, width: size }} />;
  if (query.isError || !query.data) return <ImageOff size={size * 0.6} className="muted" />;

  return (
    <img
      alt={t("common.teamLogoAlt")}
      src={query.data}
      style={{ borderRadius: 6, height: size, objectFit: "cover", width: size }}
    />
  );
}
