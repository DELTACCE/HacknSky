import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CONFIG } from '../../data/site.js';
import CtaLink from '../CtaLink.jsx';
import Section from '../Section.jsx';
import './Registration.css';

const FIELDS = [
  { name: 'name', label: 'Your name', autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'inst', label: 'Institution' },
  { name: 'team', label: 'Team name' },
  { name: 'mate', label: 'Teammate name' },
  { name: 'mmail', label: 'Teammate email', type: 'email' },
];

const KINDS = ['Team application', 'Partnership enquiry'];

/**
 * Registration / enquiry form. It stays honest: until VITE_FORM_ENDPOINT is configured the
 * form only validates and says plainly that nothing was sent. It never reports false success.
 */
export default function Registration() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const isOpen = Boolean(CONFIG.formEndpoint);
  const defaultKind = params.get('type') === 'partnership' ? KINDS[1] : KINDS[0];
  const mailHint = CONFIG.contactEmail ? ` Email ${CONFIG.contactEmail} instead.` : '';

  const onSubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus('Please complete the highlighted fields.');
      return;
    }
    if (!isOpen) {
      setStatus(
        `Applications are not open yet: this form is not connected, so nothing was sent.${mailHint}`,
      );
      return;
    }
    setSending(true);
    try {
      const res = await fetch(CONFIG.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('Received. We will be in touch.');
      form.reset();
    } catch {
      setStatus('Could not send. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Section
      id="apply"
      tag="APPLY"
      title="Register your team."
      intro={
        <>
          <p>
            Applications are not open until a registration link or form service is connected.
            Anything you type here is only sent once that is set up.
          </p>
          <p className="note" id="contact">
            {CONFIG.contactEmail
              ? `Contact: ${CONFIG.contactEmail}`
              : 'Contact email: to be added.'}
          </p>
          {CONFIG.applyUrl && (
            <p className="cta">
              <CtaLink>Open the registration page</CtaLink>
            </p>
          )}
        </>
      }
    >
      <form id="form" noValidate onSubmit={onSubmit}>
        {FIELDS.map(({ label, ...field }) => (
          <label key={field.name}>
            {label}
            <input required placeholder=" " {...field} />
          </label>
        ))}
        <label className="full">
          Enquiry type
          <select name="kind" defaultValue={defaultKind}>
            {KINDS.map((kind) => (
              <option key={kind}>{kind}</option>
            ))}
          </select>
        </label>
        <label className="full">
          Idea or message
          <textarea name="msg" rows="3" />
        </label>
        <div className="full">
          <button className="btn" type="submit" disabled={sending}>
            Submit
          </button>{' '}
          <span id="status" role="status">
            {status}
          </span>
        </div>
      </form>
    </Section>
  );
}
