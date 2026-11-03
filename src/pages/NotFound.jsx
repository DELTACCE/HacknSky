import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="flat">
      <PageHeader tag="404" title="Off the route." lead="That page doesn’t exist." />
      <div className="sec">
        <div>
          <Link className="btn" to="/">
            Back to the valley
          </Link>
        </div>
      </div>
    </div>
  );
}
