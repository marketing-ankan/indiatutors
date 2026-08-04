import { useEffect, useRef, useState } from 'react';
import { MapPin, LocateFixed, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { lookupPincode } from '../../lib/api.js';
import { Field, field, Section } from './FormBits.jsx';
import { GEO_QUALITY, STATES } from '../../data/physical.js';

/**
 * The address half of every physical-tuition form, for both sides of a match.
 *
 * Two things here are load-bearing for matching, not cosmetic:
 *
 *  - **Pincode autofill.** District and state are typed wrong constantly
 *    ("North 24 Pgs", "W.B.", "WestBengal"), and a matcher that groups by
 *    district cannot group free text. Resolving them from the pincode makes the
 *    values consistent by construction.
 *  - **"Use my current location".** A radius needs a centre. The browser's own
 *    geolocation gives an exact one for free — no map key, no bill — and the
 *    person filling the form is almost always standing at the address. The
 *    pincode centroid is the fallback, and the badge says which one we have so
 *    nobody mistakes a ~1 km guess for a doorstep.
 */
export default function AddressBlock({
  value, onChange, title = 'Address', description, requirePincode = true, compact = false,
}) {
  const [lookup, setLookup] = useState({ state: 'idle' });
  const [geo, setGeo] = useState({ state: 'idle' });
  const lastPin = useRef('');
  // The lookup lands ~350 ms after the keystroke; without this it would merge
  // into whatever `value` was when the effect ran and quietly undo anything
  // typed in between.
  const latest = useRef(value);
  latest.current = value;

  const set = (patch) => onChange({ ...latest.current, ...patch });
  const setField = (k) => (e) => set({ [k]: e.target.value });

  // Resolve the pincode as soon as it is six digits. Debounced, and guarded by
  // lastPin so re-renders don't re-fetch the same pincode forever.
  useEffect(() => {
    const pin = (value.pincode || '').replace(/\D/g, '');
    if (pin.length !== 6 || pin === lastPin.current) return;

    const timer = setTimeout(async () => {
      lastPin.current = pin;
      setLookup({ state: 'loading' });
      try {
        const res = await lookupPincode(pin);
        if (!res.found) return setLookup({ state: 'missing', message: res.message });
        setLookup({ state: 'found', data: res });
        const now = latest.current;
        // Mirror the coordinate the server would derive, so the accuracy badge
        // tells the truth straight away instead of saying "no location yet"
        // about an address we can already place. A device fix always wins.
        const keepFix = now.geo_source === 'device' && now.latitude != null;
        set({
          pincode: pin,
          // Never overwrite something the user typed themselves.
          district: now.district || res.district || '',
          state: now.state || res.state || '',
          _localities: res.localities || [],
          ...(keepFix || res.latitude == null ? {} : {
            latitude: res.latitude,
            longitude: res.longitude,
            geo_source: res.source === 'approx' ? 'approx' : 'pincode',
            geo_accuracy_m: null,
          }),
        });
      } catch {
        setLookup({ state: 'error' });
      }
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  const locate = () => {
    if (!navigator.geolocation) return setGeo({ state: 'unsupported' });
    setGeo({ state: 'loading' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          latitude: Number(pos.coords.latitude.toFixed(7)),
          longitude: Number(pos.coords.longitude.toFixed(7)),
          geo_source: 'device',
          geo_accuracy_m: Math.round(pos.coords.accuracy || 0),
        });
        setGeo({ state: 'done', accuracy: Math.round(pos.coords.accuracy || 0) });
      },
      (err) => setGeo({ state: 'denied', message: err.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const quality = value.geo_source ? GEO_QUALITY[value.geo_source] : null;

  return (
    <Section icon={MapPin} title={title} description={description}>
      <div className="space-y-3">
        {!compact && (
          <>
            <Field label="House / flat / building">
              <input value={value.address_line1 || ''} onChange={setField('address_line1')}
                placeholder="e.g. Flat 3B, Srijan Heights" className={field} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Street / road">
                <input value={value.address_line2 || ''} onChange={setField('address_line2')}
                  placeholder="e.g. AA Block, 2nd Avenue" className={field} />
              </Field>
              <Field label="Landmark" hint="helps the teacher find you">
                <input value={value.landmark || ''} onChange={setField('landmark')}
                  placeholder="e.g. behind City Centre 2" className={field} />
              </Field>
            </div>
          </>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pincode" required={requirePincode}
            hint={lookup.state === 'loading' ? 'looking up…' : undefined}>
            <div className="relative">
              <input value={value.pincode || ''} inputMode="numeric" maxLength={6}
                onChange={e => set({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                placeholder="700156" className={field} />
              {lookup.state === 'loading' && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-slate-400" />}
              {lookup.state === 'found' && <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-green-600" />}
            </div>
            {lookup.state === 'missing' && (
              <p className="mt-1 text-xs text-amber-700">{lookup.message}</p>
            )}
          </Field>

          {/* A datalist, not a select: the post-office names we get back are
              suggestions, not the full list of how people name their own area
              ("Sector V" is not a post office). Typing must always win. */}
          <Field label="Area / locality"
            hint={value._localities?.length ? 'pick or type' : undefined}>
            <input value={value.locality || ''} onChange={setField('locality')}
              list="it-localities" placeholder="e.g. New Town" className={field} />
            <datalist id="it-localities">
              {(value._localities || []).map(l => <option key={l} value={l} />)}
            </datalist>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="City / town">
            <input value={value.city || ''} onChange={setField('city')} placeholder="Kolkata" className={field} />
          </Field>
          <Field label="District">
            <input value={value.district || ''} onChange={setField('district')}
              placeholder="North 24 Parganas" className={field} />
          </Field>
          <Field label="State">
            <select value={value.state || ''} onChange={setField('state')} className={field}>
              <option value="">Select state…</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {/* Precision. The button is the cheap way to a good match, so it gets
            the explanation rather than being a bare icon. */}
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">Pin-point accuracy</p>
              <p className="text-xs text-slate-500">
                {quality?.hint || 'Sharing your location lets us measure real distance instead of guessing from the pincode.'}
              </p>
            </div>
            <button type="button" onClick={locate} disabled={geo.state === 'loading'}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-60">
              {geo.state === 'loading'
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Locating…</>
                : <><LocateFixed className="h-3.5 w-3.5" /> Use my current location</>}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {quality && (
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${quality.tone}`}>
                {quality.label}
                {value.geo_source === 'device' && value.geo_accuracy_m ? ` · ±${value.geo_accuracy_m} m` : ''}
              </span>
            )}
            {!quality && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500">
                No location yet
              </span>
            )}
            {(geo.state === 'denied' || geo.state === 'unsupported') && (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Location unavailable — we'll use the pincode centre instead.
              </span>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/** Strip the UI-only keys before posting. */
export const cleanAddress = (a = {}) => {
  const { _localities, ...rest } = a;
  return rest;
};
