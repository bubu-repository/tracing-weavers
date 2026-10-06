/**
 * The loom's voice: plucked strings, synthesised in the browser.
 *
 * The warp threads are played like the strings of a sasando, the plucked
 * harp of Rote in NTT — low on the left, high on the right, on a pentatonic
 * scale so any sweep across them sounds like music rather than noise.
 *
 * Each note is a Karplus–Strong string: a burst of noise fed round a delay
 * line as long as one period of the note, averaged on every pass, so it
 * rings and darkens the way a plucked string does. Rendered once per note
 * into a buffer, then played from the buffer.
 *
 * Silent until the visitor turns it on (browsers require that gesture, and
 * so does courtesy in an exhibition hall).
 */

/* D major pentatonic, from D3 to D6 */
const SCALE = [
    146.83, 164.81, 185.0, 220.0, 246.94, 293.66, 329.63, 369.99, 440.0, 493.88, 587.33, 659.25,
    739.99, 880.0, 987.77, 1174.66,
];

let ctx: AudioContext | null = null;
let input: GainNode | null = null;
const buffers = new Map<number, AudioBuffer>();
let recent: number[] = [];

function string(context: AudioContext, freq: number): AudioBuffer {
    const rate = context.sampleRate;
    const period = Math.max(2, Math.round(rate / freq));
    const length = Math.floor(rate * (freq < 300 ? 2.6 : 1.9));
    const buffer = context.createBuffer(1, length, rate);
    const out = buffer.getChannelData(0);
    const ring = new Float32Array(period);
    for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
    /* a softer pluck: smooth the initial noise once */
    for (let i = 1; i < period; i++) ring[i] = (ring[i] + ring[i - 1]) * 0.5;
    const decay = freq < 300 ? 0.9975 : 0.9962;
    let idx = 0;
    for (let i = 0; i < length; i++) {
        const next = (idx + 1) % period;
        out[i] = ring[idx];
        ring[idx] = decay * 0.5 * (ring[idx] + ring[next]);
        idx = next;
    }
    /* fade the tail so nothing clicks */
    const fade = Math.floor(rate * 0.25);
    for (let i = 0; i < fade; i++) out[length - 1 - i] *= i / fade;
    return buffer;
}

function chain(context: AudioContext) {
    const gain = context.createGain();
    gain.gain.value = 0.55;
    const tone = context.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 4200;
    /* a little room: one echo, fed back softly */
    const delay = context.createDelay(1);
    delay.delayTime.value = 0.21;
    const feedback = context.createGain();
    feedback.gain.value = 0.26;
    const wet = context.createGain();
    wet.gain.value = 0.22;

    gain.connect(tone);
    tone.connect(context.destination);
    tone.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(context.destination);
    return gain;
}

export async function enableLoomSound(): Promise<boolean> {
    try {
        if (!ctx) {
            const Ctor =
                window.AudioContext ??
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!Ctor) return false;
            ctx = new Ctor();
            input = chain(ctx);
        }
        await ctx.resume();
        return ctx.state === "running";
    } catch {
        return false;
    }
}

export function disableLoomSound() {
    void ctx?.suspend();
}

/**
 * Pluck the string at `position` (0 = far left, 1 = far right) with a
 * strength from 0 to 1. At most ~28 notes a second, so a fast sweep is a
 * glissando and not a wall of sound.
 */
export function pluck(position: number, strength = 0.6) {
    if (!ctx || !input || ctx.state !== "running") return;
    const now = performance.now();
    recent = recent.filter((t) => now - t < 1000);
    if (recent.length > 28) return;
    recent.push(now);

    const index = Math.min(SCALE.length - 1, Math.max(0, Math.round(position * (SCALE.length - 1))));
    let buffer = buffers.get(index);
    if (!buffer) {
        buffer = string(ctx, SCALE[index]);
        buffers.set(index, buffer);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 1 + (Math.random() - 0.5) * 0.004; // no two plucks identical
    const gain = ctx.createGain();
    gain.gain.value = 0.12 + Math.min(Math.max(strength, 0), 1) * 0.5;
    source.connect(gain);
    gain.connect(input);
    source.start();
}
