import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Sparkles, Send, Loader2, Mic, MicOff } from 'lucide-react';
import { askLesson, fetchLessonSummary } from '../lib/api.js';

// Study assistant for one lesson: a cached recap, plus questions answered from
// that lesson's transcript. Rendered only when the API reports has_ai — which
// requires both an API key and a transcript, so it never appears offering
// answers it can't ground.
//
// F2 additions:
//  - STOP & ASK: engaging the assistant (focusing the box, tapping the mic)
//    calls onEngage, and the page pauses the video. A lesson that keeps
//    talking over the student's question is the failure this exists to end.
//  - VOICE: the browser's own SpeechRecognition, en-IN. Costs nothing and
//    sends no audio to our servers — the browser transcribes locally or via
//    the vendor, and only the TEXT reaches us, same as typing. The mic button
//    simply does not render where the API is missing (Firefox): a dead
//    microphone icon is placeholder-ware.

const errText = e =>
  e?.response?.status === 429
    ? 'That\'s a lot of questions at once — give it a minute and try again.'
    : e?.response?.data?.message || 'Something went wrong. Please try again.';

const SpeechAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

export default function LessonAssistant({ courseId, lessonId, lessonTitle, onEngage }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState([]);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const recRef = useRef(null);

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

  // One recognition instance per mount; a fresh one per click leaks handlers.
  const toggleVoice = () => {
    if (!SpeechAPI) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    onEngage?.();   // stop the video before the student starts speaking
    setVoiceNote('');

    const rec = new SpeechAPI();
    recRef.current = rec;
    rec.lang = 'en-IN';           // Indian English first — this is the audience
    rec.interimResults = true;    // words appear as they are spoken
    rec.continuous = false;       // stop on natural silence, like a question ends

    rec.onresult = (ev) => {
      const text = Array.from(ev.results).map(r => r[0].transcript).join(' ').trim();
      if (text) setQuestion(text);
    };
    rec.onerror = (ev) => {
      setListening(false);
      setVoiceNote(ev.error === 'not-allowed'
        ? 'Microphone permission was refused — you can type instead.'
        : 'Could not hear that — try again, or type your question.');
    };
    rec.onend = () => setListening(false);

    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceNote('Voice input is not available right now — you can type instead.');
    }
  };

  // Leaving the lesson mid-listen must not leave the mic hot.
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* ignore */ } }, [lessonId]);

  return (
    <section className="mt-6 rounded-2xl border border-[#E7E7EF] bg-white p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-brand-600" />
        <h3 className="font-heading text-base font-extrabold text-[#0B1220]">Study assistant</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        Pause anywhere and ask — answers come from this lesson only, “{lessonTitle}”. If something wasn’t covered here, it will say so.
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
          onFocus={() => onEngage?.()}
          maxLength={500}
          placeholder={listening ? 'Listening… speak your question' : 'Ask anything about this lesson…'}
          aria-label="Ask a question about this lesson"
          className={`min-w-0 flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-brand-500 ${listening ? 'border-red-300 bg-red-50/40' : 'border-[#E7E7EF]'}`}
        />
        {SpeechAPI && (
          <button type="button" onClick={toggleVoice}
            aria-label={listening ? 'Stop listening' : 'Ask by voice'} aria-pressed={listening}
            className={`shrink-0 rounded-full p-2.5 transition ${listening ? 'animate-pulse bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}
        <button type="submit" disabled={ask.isPending || question.trim().length < 3}
          aria-label="Send question"
          className="shrink-0 rounded-full bg-brand-600 p-2.5 text-white transition hover:bg-[#0B1220] disabled:opacity-50">
          {ask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
      {voiceNote && <p className="mt-2 text-xs text-slate-500">{voiceNote}</p>}
      {ask.isError && <p className="mt-2 text-xs text-red-600">{errText(ask.error)}</p>}
    </section>
  );
}
