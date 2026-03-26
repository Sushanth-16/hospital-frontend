import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  SYMPTOM_STORAGE_KEY,
  analyzeSymptoms,
  symptomOptions
} from "../constants/aiSymptoms";

function AISymptomPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState(null);

  const groupedSymptoms = useMemo(() => {
    const groups = {};

    symptomOptions.forEach((symptom) => {
      if (!groups[symptom.specialization]) {
        groups[symptom.specialization] = [];
      }

      groups[symptom.specialization].push(symptom);
    });

    return Object.entries(groups);
  }, []);

  const toggleSymptom = (value) => {
    setSelectedSymptoms((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleAnalyze = () => {
    const analysis = analyzeSymptoms(selectedSymptoms, notes);
    setResult(analysis);
    localStorage.setItem(
      SYMPTOM_STORAGE_KEY,
      JSON.stringify({
        disease: analysis.specialization,
        createdAt: new Date().toISOString()
      })
    );
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setNotes("");
    setResult(null);
    localStorage.removeItem(SYMPTOM_STORAGE_KEY);
  };

  return (
    <div className="ai-symptom-page">
      <div className="page-header">
        <div>
          <h2>AI Symptom Checker</h2>
          <p>
            Select symptoms, add context, and get an AI-assisted doctor specialization suggestion.
          </p>
        </div>
      </div>

      <section className="ai-hero panel">
        <div>
          <span className="ai-hero-tag">Patient Triage</span>
          <h3>Find the right doctor faster</h3>
          <p>
            This is a supportive screening tool, not a final diagnosis. Severe, sudden, or
            worsening symptoms should be checked in person immediately.
          </p>
        </div>
        <div className="ai-score-badge">
          <strong>{selectedSymptoms.length}</strong>
          <span>Symptoms selected</span>
        </div>
      </section>

      <div className="panel">
        <h3>Select symptoms</h3>
        <div className="symptom-groups">
          {groupedSymptoms.map(([specialization, symptoms]) => (
            <div key={specialization} className="symptom-group">
              <h4>{specialization}</h4>
              <div className="symptom-chip-grid">
                {symptoms.map((symptom) => {
                  const isActive = selectedSymptoms.includes(symptom.value);

                  return (
                    <button
                      key={symptom.value}
                      type="button"
                      className={`symptom-chip${isActive ? " active" : ""}`}
                      onClick={() => toggleSymptom(symptom.value)}
                    >
                      {symptom.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="symptom-notes">Extra notes</label>
          <textarea
            id="symptom-notes"
            name="symptom-notes"
            rows="5"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe duration, intensity, or anything else the doctor should know."
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="primary-button"
            onClick={handleAnalyze}
            disabled={selectedSymptoms.length === 0 && !notes.trim()}
          >
            Analyze Symptoms
          </button>
          <button type="button" className="secondary-button" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      {result && (
        <section className="panel ai-result-panel">
          <div className="ai-result-header">
            <div>
              <p className="result-kicker">Suggested specialization</p>
              <h3>{result.specialization}</h3>
              <p>{result.summary}</p>
            </div>
            <div className="confidence-ring">
              <strong>{result.confidence}%</strong>
              <span>match</span>
            </div>
          </div>

          <div className="ai-result-grid">
            <div className="ai-result-card">
              <h4>Why this match</h4>
              <p>
                {result.matchedSymptoms.length > 0
                  ? result.matchedSymptoms.map((symptom) => symptom.label).join(", ")
                  : "Your notes contributed most to this recommendation."}
              </p>
            </div>
            <div className="ai-result-card">
              <h4>Next step</h4>
              <p>{result.nextSteps}</p>
            </div>
          </div>

          {result.redFlags.length > 0 && (
            <div className="status-message error">
              {result.redFlags.map((flag) => flag.message).join(" ")}
            </div>
          )}

          <div className="form-actions">
            <Link to="/appointments" className="primary-button link-button">
              Continue To Appointments
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default AISymptomPage;
