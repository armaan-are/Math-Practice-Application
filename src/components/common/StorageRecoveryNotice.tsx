import { getStorageRecoveryNotices } from '../../services/storageService';

export function StorageRecoveryNotice() {
  const notices = getStorageRecoveryNotices();
  if (notices.length === 0) return null;

  return (
    <aside aria-label="Saved data recovery" className="storage-recovery" role="status">
      <strong>Your practice is ready.</strong>
      {notices.map((notice) => (
        <p key={notice.category}>{notice.message}</p>
      ))}
    </aside>
  );
}
