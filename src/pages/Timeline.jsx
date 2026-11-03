import PageHeader from '../components/PageHeader.jsx';
import DayPlan from '../components/Timeline/DayPlan.jsx';
import Timeline from '../components/Timeline/Timeline.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function TimelinePage() {
  usePageTitle('Timeline');
  return (
    <>
      <PageHeader
        tag="TIMELINE"
        title="The route."
        lead="From the campus briefing to the ride down. Every date and time on this page is proposed, not confirmed."
      />
      <div className="flat">
        <Timeline />
        <DayPlan />
      </div>
    </>
  );
}
