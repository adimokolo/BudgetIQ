/**
 * A shimmering placeholder block matching the shape of the content that
 * will replace it once loaded. Pass width/height/radius to mimic whatever
 * you're loading in - a stat number, a chart, a table row, etc.
 */
export default function Skeleton({ width = '100%', height = 16, radius = 6, style = {} }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius, display: 'block', ...style }}
    />
  );
}
