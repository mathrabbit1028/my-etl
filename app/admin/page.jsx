import { listTopicsWithMaterials, listOwners } from '../../lib/db';
import AdminClient from './_client';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const owner = (await searchParams)?.owner || 'default';
  const [owners, topics] = await Promise.all([
    listOwners(),
    listTopicsWithMaterials(owner)
  ]);
  return (
    <div className="grid" style={{ gap: 16 }}>
      <AdminClient initialOwners={owners} initialOwner={owner} initialTopics={topics} />
    </div>
  );
}
