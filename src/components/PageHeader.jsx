/** Title block at the top of every non-home page. */
export default function PageHeader({ tag, title, lead }) {
  return (
    <header className="page-head">
      <span className="tag">{tag}</span>
      <h1 className="page-title">{title}</h1>
      {lead && <p className="lead">{lead}</p>}
    </header>
  );
}
