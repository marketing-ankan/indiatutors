import { useMemo, useState } from 'react';

// F3/F4/F5 — the whiteboard the assistant draws on.
//
// The server hands over a validated board: a headline, numbered steps with
// optional formulas, an optional bar diagram, an optional slider simulator.
// Nothing here renders model-authored markup — every value is text placed into
// elements we control, and the diagram is SVG we draw from numbers. A model
// free to emit HTML or SVG into a page children use is an XSS surface and a
// layout lottery; a constrained schema is neither.

/**
 * Evaluate arithmetic in one variable, WITHOUT eval or Function.
 *
 * Shunting-yard into RPN, then evaluate. It exists because the expression
 * comes from a language model: `eval` would hand it the page, and `new
 * Function` is the same thing wearing a hat. The server already whitelists the
 * characters; this is the second lock, so a change on one side cannot quietly
 * unlock the other.
 *
 * Returns null on anything malformed — the caller then hides the simulator
 * rather than printing NaN at a child.
 */
export function evalArithmetic(expression, x) {
  const src = String(expression);
  if (!/^[0-9x+\-*/().\s]*$/i.test(src)) return null;

  const tokens = src.match(/\d+\.?\d*|[xX]|[+\-*/()]/g);
  if (!tokens) return null;

  const prec = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const out = [], ops = [];
  let prev = null;
  let negateNext = false;   // a pending unary minus

  const pushOperand = (n) => { out.push(negateNext ? -n : n); negateNext = false; };

  for (const t of tokens) {
    if (/^\d/.test(t)) { pushOperand(Number(t)); }
    else if (/^[xX]$/.test(t)) { pushOperand(Number(x)); }
    else if (t === '(') { ops.push(t); }
    else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop());
      if (ops.pop() !== '(') return null;            // unbalanced
    } else {
      // Unary minus NEGATES THE NEXT OPERAND rather than becoming "0 - …".
      // The 0-trick is wrong the moment a tighter operator precedes it:
      // "2 * -3" popped the '*' and multiplied 2 by the placeholder 0, so
      // 2 * -3 + 1 evaluated to -2 instead of -5.
      if (t === '-' && (prev === null || prev === '(' || prev in prec)) {
        negateNext = !negateNext;
        prev = t;
        continue;
      }
      while (ops.length && ops[ops.length - 1] !== '(' && prec[ops[ops.length - 1]] >= prec[t]) out.push(ops.pop());
      ops.push(t);
    }
    prev = t;
  }
  if (negateNext) return null;   // trailing '-' with nothing to negate
  while (ops.length) { const op = ops.pop(); if (op === '(') return null; out.push(op); }

  const st = [];
  for (const tok of out) {
    if (typeof tok === 'number') { st.push(tok); continue; }
    const b = st.pop(), a = st.pop();
    if (a === undefined || b === undefined) return null;
    if (tok === '+') st.push(a + b);
    else if (tok === '-') st.push(a - b);
    else if (tok === '*') st.push(a * b);
    else if (tok === '/') { if (b === 0) return null; st.push(a / b); }
  }
  const r = st.pop();
  return st.length === 0 && Number.isFinite(r) ? r : null;
}

const round = n => Math.round(n * 1000) / 1000;

function Bars({ diagram }) {
  const max = Math.max(...diagram.items.map(i => Math.abs(i.value)), 1);
  return (
    <figure className="mt-4">
      <ul className="space-y-1.5">
        {diagram.items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="grid grid-cols-[5rem_1fr_3rem] items-center gap-2">
            <span className="truncate text-xs text-slate-600" title={it.label}>{it.label}</span>
            <span className="h-3 rounded-r bg-brand-600" style={{ width: `${Math.max(2, (Math.abs(it.value) / max) * 100)}%` }} />
            <span className="text-right text-xs font-semibold tabular-nums text-slate-700">{round(it.value)}</span>
          </li>
        ))}
      </ul>
      {diagram.caption && <figcaption className="mt-1.5 text-xs text-slate-500">{diagram.caption}</figcaption>}
    </figure>
  );
}

/** F5 — the diagram you can open and play with. */
function Simulator({ sim }) {
  const [x, setX] = useState(sim.min);
  const y = useMemo(() => evalArithmetic(sim.expression, x), [sim.expression, x]);

  // An expression that will not evaluate is not shown at all. A slider that
  // prints NaN teaches a child the wrong thing about maths.
  if (y === null) return null;

  return (
    <div className="mt-4 rounded-xl bg-[#F7F9FC] p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Try it</p>
      {sim.caption && <p className="mt-1 text-xs text-slate-600">{sim.caption}</p>}
      <div className="mt-2 flex items-center gap-3">
        <label className="text-sm font-bold text-[#0B1220]" htmlFor="sim-x">x</label>
        <input id="sim-x" type="range" min={sim.min} max={sim.max} step={sim.step} value={x}
          onChange={e => setX(Number(e.target.value))} className="flex-1 accent-brand-600" />
        <span className="w-10 text-right text-sm font-bold tabular-nums text-[#0B1220]">{round(x)}</span>
      </div>
      <p className="mt-2 font-mono text-sm text-slate-700">
        {sim.expression.replace(/x/gi, round(x))} = <strong className="text-brand-700">{round(y)}</strong>
      </p>
    </div>
  );
}

export default function LessonBoard({ board }) {
  if (!board) return null;

  return (
    <div className="mt-4 rounded-xl border border-brand-100 bg-white p-4">
      <p className="font-heading text-sm font-extrabold text-[#0B1220]">{board.headline}</p>

      <ol className="mt-3 space-y-2">
        {board.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-slate-700">{s.text}</p>
              {s.formula && (
                <p className="mt-1 inline-block rounded bg-[#F7F9FC] px-2 py-1 font-mono text-sm text-[#0B1220]">{s.formula}</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      {board.diagram && <Bars diagram={board.diagram} />}
      {board.simulator && <Simulator sim={board.simulator} />}
    </div>
  );
}
