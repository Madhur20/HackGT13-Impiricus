import { parseAnswerSections } from "@relay/doctor-connect";

/** Renders a reviewed physician answer, laying out scaffold sections when the text uses them. */
export function PeerAnswerBody({ text }: { text: string }) {
  const parsed = parseAnswerSections(text);
  if (!parsed) return <p>{text}</p>;
  return <div className="answer-sections">
    {parsed.preamble ? <p className="answer-sections-preamble">{parsed.preamble}</p> : null}
    <dl>{parsed.sections.filter((section) => section.value).map((section, index) => <div className={`answer-section ${section.id}`} key={`${section.id}-${index}`}>
      <dt>{section.label}</dt>
      <dd>{section.value}</dd>
    </div>)}</dl>
  </div>;
}
