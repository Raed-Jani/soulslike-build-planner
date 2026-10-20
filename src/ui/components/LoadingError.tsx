interface Props {
  message: string;
  onRetry: () => void;
}

export default function LoadingError({ message, onRetry }: Props) {
  return (
    <div className="load-error" role="alert">
      <p className="load-error__msg">⚠ Could not load weapon data</p>
      <p className="load-error__detail">{message}</p>
      <button className="load-error__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
