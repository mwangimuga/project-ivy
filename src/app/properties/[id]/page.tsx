export const dynamic = "force-dynamic";

import PropertyDetailClient from "./PropertyDetailClient";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <PropertyDetailClient params={params} />;
}
