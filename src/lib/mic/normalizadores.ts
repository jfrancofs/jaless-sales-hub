export function cleanText(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function upper(value: unknown): string {
  return cleanText(value).toUpperCase();
}

function ntext(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n).replace(/\.0+$/, '');
}

export function normMeasure(value: string): string {
  let s = upper(value)
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/[×*]/g, 'X')
    .replace(/MM$/,'')
    .replace(/"/g,'');

  const mx = s.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (mx) return `${ntext(Number(mx[1]))}X${ntext(Number(mx[2]))}`;

  const md = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (md) return `${md[1]}-${md[2]}`;

  const ms = s.match(/^([EIR])[-]?(\d+)$/);
  if (ms) return `${ms[1]}-${ms[2].padStart(3,'0')}`;

  return s;
}

export function normPinMeasure(value: string): string {
  const raw = upper(value).replace(/\s+/g, '').replace(/,/g, '.').replace(/[×X]/g, '*');
  const m = raw.match(/^M?(\d+(?:\.\d+)?)\*(\d+(?:\.\d+)?)$/);
  if (!m) return raw;
  return `M${ntext(Number(m[1]))}*${ntext(Number(m[2]))}`;
}

export function normCordonMeasure(value: string): string {
  const raw = upper(value).replace(/\s+/g, '').replace(/,/g, '.').replace(/MM$/,'');
  const mx = raw.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)$/);
  if (mx) return `${ntext(Number(mx[1]))}X${ntext(Number(mx[2]))}`;
  const m = raw.match(/^(\d+(?:\.\d+)?)/);
  return m ? ntext(Number(m[1])) : raw;
}

export function normBillaMeasure(value: string): string {
  let raw = upper(value)
    .replace(/\s+/g, '')
    .replace(/,/g, '.')
    .replace(/MM$/,'')
    .replace(/P$/,'')
    .replace(/"/g,'');
  const frac = raw.match(/^(\d+\/\d+)$/);
  if (frac) return frac[1];
  const num = raw.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return ntext(Number(num[1]));
  return raw;
}

export function normBondedCode(value: string): string {
  let raw = upper(value).replace(/\s+/g, '').replace(/_/g, '-');
  raw = raw.replace(/^BSPSCR/, 'SCR');
  raw = raw.replace(/^BS-/, 'BS-').replace(/^SCR-?/, 'SCR-').replace(/^ARJ-?/, 'ARJ-');
  raw = raw.replace(/BONDEDSEAL/g, '');
  return raw;
}

export function normPerno(value: string): string {
  const raw = upper(value).replace(/\s+/g, '').replace(/,/g, '.').replace(/MM$/,'').replace(/"/g,'');
  const frac = raw.match(/^(\d+\/\d+)$/);
  if (frac) return frac[1];
  const mixto = raw.match(/^(\d+)\+(\d+\/\d+)$/);
  if (mixto) return `${mixto[1]} ${mixto[2]}`;
  const num = raw.match(/^(\d+(?:\.\d+)?)$/);
  if (num) return ntext(Number(num[1]));
  return raw;
}
