import { useEffect, useRef } from 'react';
import type { ResearchEntry } from '../types/research';
import './StudyDocument.css';

interface StudyDocumentProps {
  study: ResearchEntry;
  locationName: string;
  onClose: () => void;
}

export function StudyDocument({ study, locationName, onClose }: StudyDocumentProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="study-document-dialog"
      aria-labelledby="study-document-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right ||
              event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
    >
      <div className="study-document-toolbar">
        <span>Research Atlas · Study document</span>
        <button type="button" onClick={onClose} autoFocus>Close document</button>
      </div>
      <article className="study-document-page">
        <header>
          <p className="eyebrow">IBA College of Mindanao Inc.</p>
          <h1 id="study-document-title">{study.title}</h1>
          <p className="study-document-location">{locationName}</p>
        </header>
        <section aria-labelledby="study-overview-heading">
          <h2 id="study-overview-heading">Overview</h2>
          <p className="study-document-overview">
            {study.description?.trim() || 'An overview has not been added for this study yet.'}
          </p>
        </section>
        {study.researchers.length > 0 && (
          <section aria-labelledby="study-researchers-heading">
            <h2 id="study-researchers-heading">Researchers</h2>
            <ul className="study-researcher-profiles">
              {study.researchers.map((researcher, index) => (
                <li key={`${researcher.name}-${index}`}>
                  {researcher.photo ? (
                    <img className="study-researcher-photo" src={researcher.photo} alt={`Portrait of ${researcher.name}`} />
                  ) : <span className="study-researcher-photo study-researcher-placeholder" aria-label="No photo available">{researcher.name.trim().charAt(0).toUpperCase()}</span>}
                  <div>
                    <strong>{researcher.name}</strong>
                    {researcher.degree && <p>{researcher.degree}</p>}
                    {researcher.age != null && <p>Age: {researcher.age}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </dialog>
  );
}
