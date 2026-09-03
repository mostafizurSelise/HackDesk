import { ImageOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getLogoUrl } from "../../features/registration/uploadLogo";
import { Skeleton } from "./Skeleton";

export function LogoThumbnail({ fileId, size = 40 }: { fileId?: string; size?: number }) {
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
      alt="Team logo"
      src={query.data}
      style={{ borderRadius: 6, height: size, objectFit: "cover", width: size }}
    />
  );
}
