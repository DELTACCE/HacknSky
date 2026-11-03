import Mentors from '../components/Mentors/Mentors.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Tracks from '../components/Tracks/Tracks.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function TracksPage() {
  usePageTitle('Tracks');
  return (
    <>
      <PageHeader
        tag="CHALLENGES"
        title="Pick a problem."
        lead="Challenge tracks, mentors and judges will be announced before applications close."
      />
      <div className="flat">
        <Tracks />
        <Mentors />
      </div>
    </>
  );
}
