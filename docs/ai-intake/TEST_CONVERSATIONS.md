# MediKiosk AI Intake Benchmark Test Conversations

## Conversation 1: Standard English Respiratory Case
1. AI: "Hi, I'm MediKiosk's AI intake assistant. I'll ask you a few questions about your health before you see the doctor. Is that okay?"
   Patient: "Yes, sure."
2. AI: "What brings you here today?"
   Patient: "I've had a bad cough for the past 3 days."
3. AI: "Are you having any difficulty breathing?"
   Patient: "No difficulty breathing, just coughing."
4. AI: "Is the cough dry or does it bring up mucus?"
   Patient: "It's mostly dry."
5. AI: "Have you had any fever or felt hot or cold?"
   Patient: "A slight fever yesterday."
6. AI: "Do you have any existing medical conditions?"
   Patient: "No, none."
7. AI: "Are you currently taking any medications?"
   Patient: "No medications."
8. AI: "Do you have any allergies?"
   Patient: "No allergies."
9. AI: "Thank you. I have recorded your information for the doctor."

## Conversation 2: Hindi/Hinglish Case
1. AI: "Namaste! Main MediKiosk ka AI intake assistant hoon. Doctor se milne se pehle main aapse aapki sehat ke baare mein kuch sawal pooch sakta hoon?"
   Patient: "Haan theek hai."
2. AI: "Aapko aaj kya pareshani ho rahi hai?"
   Patient: "Mujhe 2 din se pet mein dard ho raha hai."
3. AI: "Pet mein dard kis jagah par zyada mehsoos ho raha hai?"
   Patient: "Right side mein neeche ki taraf."
4. AI: "Kya aapko ulti ya nausea (matli) jaisa lag raha hai?"
   Patient: "Haan, subah se ulti jaisa lag raha hai."

## Conversation 3: Red-Flag Emergency Signal Case
1. AI: "What brings you here today?"
   Patient: "I have crushing chest pain radiating to my left arm and I can barely breathe."
   -> Safety Engine triggers: `possible_acute_chest_emergency`, `possible_severe_breathing_problem`.
   -> Immediate safety handoff alert activated, prioritizing emergency triage.
