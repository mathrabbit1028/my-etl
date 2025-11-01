import { listTopicsWithMaterials } from '../../lib/db';
import AdminClient from './_client';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const topics = await listTopicsWithMaterials();
  return (
    <div className="grid" style={{ gap: 16 }}>
      <h1>관리자</h1>
      <AdminClient initialTopics={topics} />
    </div>
  );
}
