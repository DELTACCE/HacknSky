import PageHeader from '../components/PageHeader.jsx';
import Partners from '../components/Partners/Partners.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Sponsors() {
  usePageTitle('Sponsors');
  return (
    <>
      <PageHeader
        tag="PARTNERS"
        title="Recognition and support."
        lead="No sponsors, awards or partners are confirmed yet."
      />
      <div className="flat">
        <Partners />
      </div>
    </>
  );
}
