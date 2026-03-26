export const SYMPTOM_STORAGE_KEY = "hms-ai-symptom";

export const symptomOptions = [
  { value: "chest-pain", label: "Chest pain", specialization: "Cardiology", weight: 4 },
  { value: "palpitations", label: "Heart palpitations", specialization: "Cardiology", weight: 3 },
  { value: "high-blood-pressure", label: "High blood pressure", specialization: "Cardiology", weight: 2 },
  { value: "skin-rash", label: "Skin rash", specialization: "Dermatology", weight: 4 },
  { value: "itching", label: "Persistent itching", specialization: "Dermatology", weight: 3 },
  { value: "acne", label: "Acne breakout", specialization: "Dermatology", weight: 2 },
  { value: "fatigue", label: "Extreme fatigue", specialization: "Endocrinology", weight: 2 },
  { value: "weight-gain", label: "Unexpected weight gain", specialization: "Endocrinology", weight: 3 },
  { value: "weight-loss", label: "Unexpected weight loss", specialization: "Endocrinology", weight: 3 },
  { value: "stomach-pain", label: "Stomach pain", specialization: "Gastroenterology", weight: 4 },
  { value: "nausea", label: "Nausea", specialization: "Gastroenterology", weight: 2 },
  { value: "acidity", label: "Acidity or reflux", specialization: "Gastroenterology", weight: 3 },
  { value: "fever", label: "Fever", specialization: "General Medicine", weight: 3 },
  { value: "cold-cough", label: "Cold or cough", specialization: "General Medicine", weight: 2 },
  { value: "body-pain", label: "Body pain", specialization: "General Medicine", weight: 2 },
  { value: "headache", label: "Severe headache", specialization: "Neurology", weight: 4 },
  { value: "dizziness", label: "Dizziness", specialization: "Neurology", weight: 3 },
  { value: "numbness", label: "Numbness or tingling", specialization: "Neurology", weight: 4 },
  { value: "lump", label: "Lump or swelling", specialization: "Oncology", weight: 4 },
  { value: "persistent-pain", label: "Persistent unexplained pain", specialization: "Oncology", weight: 3 },
  { value: "joint-pain", label: "Joint pain", specialization: "Orthopedics", weight: 4 },
  { value: "back-pain", label: "Back pain", specialization: "Orthopedics", weight: 3 },
  { value: "injury", label: "Bone or muscle injury", specialization: "Orthopedics", weight: 4 },
  { value: "child-fever", label: "Child fever", specialization: "Pediatrics", weight: 3 },
  { value: "child-cough", label: "Child cough", specialization: "Pediatrics", weight: 2 },
  { value: "anxiety", label: "Anxiety or panic", specialization: "Psychiatry", weight: 4 },
  { value: "low-mood", label: "Low mood", specialization: "Psychiatry", weight: 3 },
  { value: "sleep-issues", label: "Sleep issues", specialization: "Psychiatry", weight: 2 }
];

const keywordRules = [
  { specialization: "Cardiology", words: ["chest", "heart", "pulse", "palpitation", "pressure"] },
  { specialization: "Dermatology", words: ["rash", "itch", "skin", "acne", "allergy"] },
  { specialization: "Endocrinology", words: ["thyroid", "sugar", "diabetes", "hormone", "weight"] },
  { specialization: "Gastroenterology", words: ["stomach", "acidity", "reflux", "vomit", "digestion"] },
  { specialization: "General Medicine", words: ["fever", "cold", "cough", "infection", "weakness"] },
  { specialization: "Neurology", words: ["headache", "migraine", "numb", "dizzy", "seizure"] },
  { specialization: "Oncology", words: ["lump", "bleeding", "swelling", "tumor"] },
  { specialization: "Orthopedics", words: ["joint", "knee", "back", "fracture", "muscle"] },
  { specialization: "Pediatrics", words: ["child", "baby", "infant", "kid"] },
  { specialization: "Psychiatry", words: ["anxiety", "stress", "panic", "depression", "sleep"] }
];

const redFlagRules = [
  { label: "chest pain", message: "Chest pain should be assessed urgently, especially with shortness of breath." },
  { label: "numbness", message: "Numbness can need urgent neurological evaluation if it starts suddenly." },
  { label: "severe headache", message: "A sudden severe headache can be an emergency if it feels unusual or intense." },
  { label: "shortness of breath", message: "Trouble breathing should be checked immediately." },
  { label: "bleeding", message: "Uncontrolled bleeding needs immediate medical attention." }
];

export function analyzeSymptoms(selectedSymptoms = [], notes = "") {
  const scores = new Map();

  symptomOptions.forEach((symptom) => {
    if (selectedSymptoms.includes(symptom.value)) {
      scores.set(
        symptom.specialization,
        (scores.get(symptom.specialization) || 0) + symptom.weight
      );
    }
  });

  const normalizedNotes = notes.trim().toLowerCase();

  keywordRules.forEach((rule) => {
    rule.words.forEach((word) => {
      if (normalizedNotes.includes(word)) {
        scores.set(rule.specialization, (scores.get(rule.specialization) || 0) + 1);
      }
    });
  });

  const ranked = [...scores.entries()].sort((left, right) => right[1] - left[1]);
  const [topMatch, secondMatch] = ranked;
  const specialization = topMatch?.[0] || "General Medicine";
  const topScore = topMatch?.[1] || 1;
  const secondScore = secondMatch?.[1] || 0;
  const confidence = Math.min(
    95,
    Math.max(58, Math.round(60 + topScore * 6 + (topScore - secondScore) * 4))
  );

  const matchedSymptoms = symptomOptions.filter((symptom) =>
    selectedSymptoms.includes(symptom.value)
  );

  const redFlags = redFlagRules.filter((rule) => {
    if (normalizedNotes.includes(rule.label)) {
      return true;
    }

    return matchedSymptoms.some((symptom) =>
      symptom.label.toLowerCase().includes(rule.label)
    );
  });

  return {
    specialization,
    confidence,
    matchedSymptoms,
    redFlags,
    summary:
      specialization === "General Medicine"
        ? "A broad physician review is the safest first step based on the current symptom pattern."
        : `The current symptom pattern leans most toward ${specialization}.`,
    nextSteps:
      redFlags.length > 0
        ? "Urgent symptoms were detected. Seek emergency or immediate in-person care if symptoms are severe or worsening."
        : `Book with a ${specialization} doctor for a focused consultation and medical confirmation.`
  };
}
