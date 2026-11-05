import { useMemo, useState } from 'react';
import type { ResearchEntry, ResearcherEntry, ResearchLocation } from '../types/research';
import { updateResearcherProfile } from '../services/api';
import { prepareResearcherPhoto } from '../utils/researcherPhoto';
import './ResearcherManagement.css';

function ResearcherProfileEditor({ study, index, onUpdated }: {
  study: ResearchEntry;
  index: number;
  onUpdated: (locations: ResearchLocation[]) => void;
}) {
  const [profile, setProfile] = useState<ResearcherEntry>({ ...study.researchers[index] });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const change = (patch: Partial<ResearcherEntry>) => {
    setProfile((previous) => ({ ...previous, ...patch }));
    setMessage('');
  };
  const upload = async (file: File) => {
    setBusy(true);
    setError('');
    try { change({ photo: await prepareResearcherPhoto(file) }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not process photo.'); }
    finally { setBusy(false); }
  };

  return (
    <form className="researcher-profile-editor" onSubmit={async (event) => {
      event.preventDefault();
      if (busy) return;
      setBusy(true);
      setError('');
      setMessage('');
      try {
        const updated = await updateResearcherProfile(study.id, index, profile);
        onUpdated(updated);
        setMessage('Profile saved. The photo is now available in the study document.');
      } catch (err) { setError(err instanceof Error ? err.message : 'Could not save profile.'); }
      finally { setBusy(false); }
    }}>
      <p className="researcher-profile-study">{study.title}</p>
      <fieldset disabled={busy}>
        <div className="researcher-profile-portrait">
          {profile.photo ? <img src={profile.photo} alt={`Portrait of ${profile.name}`} /> : <span>No photo</span>}
          <label>2×2 picture
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = '';
            }} />
          </label>
          {profile.photo && <button type="button" onClick={() => change({ photo: '' })}>Remove photo</button>}
        </div>
        <label>Researcher name<input required value={profile.name} onChange={(event) => change({ name: event.target.value })} /></label>
        <label>Age<input type="number" min="1" max="120" step="1" value={profile.age ?? ''} onChange={(event) => change({ age: event.target.value === '' ? undefined : Number(event.target.value) })} /></label>
        <label>Degree<input value={profile.degree} onChange={(event) => change({ degree: event.target.value })} /></label>
        <button type="submit" className="submit-button">{busy ? 'Processing…' : 'Save profile'}</button>
      </fieldset>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
    </form>
  );
}

export function ResearcherManagement({ locations, onUpdated }: {
  locations: ResearchLocation[];
  onUpdated: (locations: ResearchLocation[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const studies = useMemo(() => [...new Map(locations.flatMap((location) => location.researches).map((study) => [study.id, study])).values()], [locations]);
  const profiles = studies.flatMap((study) => study.researchers.map((researcher, index) => ({ study, researcher, index })))
    .filter(({ study, researcher }) => `${study.title} ${researcher.name}`.toLowerCase().includes(query.trim().toLowerCase()));
  const selected = profiles.find(({ study, index }) => `${study.id}-${index}` === selectedKey);
  return (
    <section className="researcher-management">
      <h2>Researcher profiles</h2>
      <p>Upload a 2×2 picture and update researcher details. Save each profile to show it in the public study document.</p>
      <label className="researcher-profile-search">Find a researcher or study
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or study title" />
      </label>
      <label className="researcher-profile-search">Choose researcher
        <select value={selected ? selectedKey : ''} onChange={(event) => setSelectedKey(event.target.value)}>
          <option value="">Select a researcher to load their photo and details</option>
          {profiles.map(({ study, researcher, index }) => (
            <option key={`${study.id}-${index}`} value={`${study.id}-${index}`}>{researcher.name} — {study.title}</option>
          ))}
        </select>
      </label>
      {selected && <ResearcherProfileEditor key={selectedKey} study={selected.study} index={selected.index} onUpdated={onUpdated} />}
      {profiles.length === 0 && <p>No researchers found. Add researchers to a study in Research &amp; locations.</p>}
    </section>
  );
}
