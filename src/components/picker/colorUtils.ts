export function rgb2hex(r, g, b): `#${string}` {
  "worklet";
  r = Math.round(r).toString(16);
  g = Math.round(g).toString(16);
  b = Math.round(b).toString(16);

  r = r.length === 1 ? "0" + r : r;
  g = g.length === 1 ? "0" + g : g;
  b = b.length === 1 ? "0" + b : b;

  // TODO: Why processColor accepts wrong color order?
  // It looks like it somehow needs to be rotated 8 bits left
  // g, b, a, r
  return `#${g + b + "FF" + r}`;
}
