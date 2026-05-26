type ApiErrorMessageProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export default function ApiErrorMessage({
  title = 'Something failed to load',
  message,
  onRetry,
}: ApiErrorMessageProps) {
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-left text-red-900 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-bold">{title}</p>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="self-start rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-bold text-red-900 hover:bg-red-100"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
