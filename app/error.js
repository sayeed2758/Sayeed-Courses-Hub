"use client";

export default function GlobalError({ reset }) {
  return (
    <main className="reference-shell">
      <div className="page-empty" role="alert">
        <h2>Something went wrong.</h2>
        <p>Please try again. Your saved Firebase data is not changed by this screen.</p>
        <button type="button" className="modal-primary" onClick={() => reset()}>TRY AGAIN</button>
      </div>
    </main>
  );
}
