const nok = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

export const kr = (v: number) => (Number.isFinite(v) ? `${nok.format(Math.round(v))} kr` : '–');
export const krShort = (v: number) => {
  if (!Number.isFinite(v)) return '–';
  const a = Math.abs(v);
  if (a >= 1_000_000) return `${(v / 1_000_000).toLocaleString('nb-NO', { maximumFractionDigits: 1 })} mill`;
  if (a >= 1_000) return `${Math.round(v / 1_000).toLocaleString('nb-NO')}k`;
  return nok.format(Math.round(v));
};
export const pct = (v: number, digits = 0) =>
  `${(v * 100).toLocaleString('nb-NO', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
export const uid = () => Math.random().toString(36).slice(2, 10);
