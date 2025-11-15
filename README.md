# ChildClickCare

## What It Does
ChildClickCare is an AI-powered application for parents that helps them track and organize their child’s health. Parents can either voice or message the AI about symptoms, medications, or behaviour changes, and the system automatically logs this information. Each entry is organized by date and displayed on a vertical timeline with colour-coded severity indicators:

- **Green**: Low severity  
- **Yellow**: Moderate severity  
- **Red**: High severity  

Parents can click any entry to edit or add more information. Over time, the logs generate insights that help parents and doctors make informed decisions about the child’s care. The system is designed to make home health tracking easy, organized, and actionable.

## Tech Stack
Javascript, React, CSS, Express.js, OpenAI Whisper, Ollama

## Challenges
One major challenge was coordinating data between the Home page, AI, backend, and Timeline. Early on, updates would fail or appear out of order. We solved this by creating detailed diagrams of data flow, which helped us visualize and fix the issues.  

Voice input also presented challenges, as we needed Whisper transcription to be accurate and smooth. Designing the timeline to automatically categorize, colour-code, and display logs clearly was another hurdle. Integrating multiple tools—Firebase, Whisper, Ollama, and React—into a single, seamless experience took careful planning and iteration.

## What’s Next
We plan to expand ChildClickCare beyond infants, adapting it for **dementia patients** and **elderly care**. Features will include tracking memory changes, behavioural patterns, medication reminders, caregiver notes, and daily health observations.  

Future improvements also include:  
- Multilingual support for parents facing language barriers  
- AI-powered follow-up questions for deeper insights  
- Export feature to automatically generate reports for doctors  
- Making the AI more engaging by using patient history to provide smarter responses  
