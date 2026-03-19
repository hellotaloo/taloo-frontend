import { redirect } from 'next/navigation';

export default async function MappingRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/admin/integrations/${slug}/mapping/import`);
}
