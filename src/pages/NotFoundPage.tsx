import { FriendlyError } from '../components/common/FriendlyError';

export function NotFoundPage() {
  return (
    <FriendlyError
      actionLabel="Start practicing"
      actionTo="/practice/setup"
      eyebrow="404"
      title="That page wandered off"
      message="No problem—we could not find that page. Choose a safe path below and keep your math adventure going."
    />
  );
}
