import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { askLesson, fetchLessonSummary } from '../lib/api.js';

// Study assistant for one lesson: a cached recap, plus questions answered from
// that lesson's transcript. Rendered only when the API reports has_ai — which
// requires both an API key and a transcript, so it never appears offering
// answers it can't ground.

const errText = e =>
  e?.response?.status === 429
    ? 'That\'s a lot of questions at once — give it a minute and try again.'
    : e?.response?.data?.message || 'Something went wrong. Please try again.';

export default function LessonAssistant({ courseId, lessonId, lessonTitle }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);

  // The summary loads on its own so it reads as part of the lesson, not a
  // feature to discover. Only the first ever view of a lesson costs an API
  // call — the answer is stored server-side, so every later view is a DB read.
  // retry:false matters: if generation is failing, a retrying query would have
  // every viewer hammering the provider.
  const summary = useQuery({
    queryKey: ['lesson-summary', lessonId],
    queryFn: () => fetchLessonSummary({ courseId, lessonId }),
    retry: false,
    staleTime: Infinity,
  });

  const ask = useMutation({
    mutationFn: q => askLesson({ courseId, lessonId, question: q }),
    onSuccess: (answer, q) => {
      setThread(t => [...t, { q, answer }]);
      setQuestion('');
    },
  });

  const submit = e => {
    e.preventDefault();
    const q = question.trim();
    if (q.length >= 3 && !ask.isPending) ask.mutate(q);
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#E7E7EF] bg-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h3 className="font-heading text-base font-extrabold text-[#0B1220]">Study assistant</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Answers come from this lesson only — “{lessonTitle}”. If something wasn’t covered here, it will say so.
      </p>

      {/* A failed summary stays silent — it's passive content the student never
          asked for, so an error banner would be noise. The Q&A below still works. */}
      {summary.isLoading && (
        <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing a summary of this lesson…
        </p>
      )}
      {summary.data && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">Lesson summary</p>
          <div className="whitespace-pre-line rounded-xl bg-[#F7F9FC] p-4 text-sm leading-relaxed text-slate-700">
            {summary.data}
          </div>
        </div>
      )}

      {thread.map((item, i) => (
        <div key={i} className="mt-4">
          <p className="text-sm font-bold text-[#0B1220]">{item.q}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{item.answer}</p>
        </div>
      ))}

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Ask anything about this lesson…"
          aria-label="Ask a question about this lesson"
          className="min-w-0 flex-1 rounded-full border border-[#E7E7EF] px-4 py-2.5 text-sm outline-none focus:border-brand-500"
        />
        <button type="submit" disabled={ask.isPending || question.trim().length < 3}
          aria-label="Send question"
          className="shrink-0 rounded-full bg-brand-600 p-2.5 text-white transition hover:bg-[#0B1220] disabled:opacity-50">
          {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {ask.isError && <p className="mt-2 text-xs text-red-600">{errText(ask.error)}</p>}
    </section>
  );
}
