import { useState } from "react";

export default function ShareComparison({ createLink }: { createLink: () => string }) {
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");

  async function share() {
    try {
      const url = createLink();
      setLink(url);
      setMessage("Link ready. You can copy it below or bookmark this page.");
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Link copied. You can also bookmark this page.");
      } catch {
        // The visible field remains usable when clipboard permission is unavailable.
      }
    } catch (error) {
      setLink("");
      setMessage(error instanceof Error ? error.message : "Could not create a share link.");
    }
  }

  return (
    <div className="share-comparison">
      <button type="button" onClick={share}>Share comparison</button>
      {link && (
        <label>
          Comparison link (created when you pressed Share)
          <input type="text" readOnly value={link} onFocus={(event) => event.target.select()} />
        </label>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
