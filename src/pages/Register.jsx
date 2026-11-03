import PageHeader from '../components/PageHeader.jsx';
import Registration from '../components/Registration/Registration.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Register() {
  usePageTitle('Register');
  return (
    <>
      <PageHeader
        tag="APPLY"
        title="Join the adventure."
        lead="Applications are not open yet. This form only sends once a registration service is connected."
      />
      <div className="flat">
        <Registration />
      </div>
    </>
  );
}
