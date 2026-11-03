import { Fragment } from 'react';

/** Renders copy arrays: strings as text, `{ em }` as <em>, `{ b }` as <b>. */
export default function RichText({ parts }) {
  return parts.map((part, i) => {
    if (typeof part === 'string') return <Fragment key={i}>{part}</Fragment>;
    if (part.em) return <em key={i}>{part.em}</em>;
    return <b key={i}>{part.b}</b>;
  });
}

/** Title lines separated by <br>. */
export function TitleLines({ lines }) {
  return lines.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      <RichText parts={line} />
    </Fragment>
  ));
}
