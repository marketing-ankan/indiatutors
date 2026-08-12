/**
 * Shown when a list request FAILS, in place of the list's empty state.
 *
 * Every list on the site used to fall through to its "nothing here" copy when
 * the request errored, so a backend hiccup told the visitor we sell no courses,
 * have no tutors, run no classes. That is a worse lie than an error message,
 * and it is indistinguishable from the truth at a glance — it is exactly how a
 * dev server being off got read as "the video courses are missing".
 *
 * `what` names the thing in the visitor's words, e.g. "courses", "tutors".
 */
export default function ListLoadError({ what = 'results', onRetry, retrying = false }) {
  return (
    <div className="rounded-xl bg-red-50 px-6 py-10 text-center text-red-700 ring-1 ring-red-100">
      <p className="font-semibold">We couldn't load the {what} just now.</p>
      <p className="mt-1 text-sm text-red-600">
        This is a problem at our end, not a sign that there are none.
      </p>
      {onRetry && (
        <button type="button" onClick={onRetry} disabled={retrying}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
          {retrying ? 'Trying…' : 'Try again'}
        </button>
      )}
    </div>
  );
}
