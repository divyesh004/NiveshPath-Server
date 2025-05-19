# PRD: Proactive AI-Driven Personal Finance Chatbot Enhancements

## Objective

Upgrade the existing personal finance chatbot backend to be proactive by automatically asking relevant questions to users based on profile completeness, guiding them through a conversation that builds their financial profile and offers tailored advice.

---

## 1. Problem Statement

Currently, the chatbot responds passively to user inputs but does not initiate or continue conversations with context-aware questions. Users may not know what to provide unless prompted, which leads to poor profile completeness and generic advice.

---

## 2. Goals

* Make the chatbot proactive and conversational.
* Auto-detect incomplete profile fields.
* Ask dynamic, relevant follow-up questions.
* Update the prompt engineering to support proactive behavior.
* Improve session continuity and user experience.

---

## 3. Key Features

### 3.1 Profile Completeness Check

* Use the existing `checkProfileCompleteness(profile)` function to identify missing fields such as:

  * name
  * age
  * income
  * financial goals
  * location
  * occupation

### 3.2 Dynamic Follow-Up Engine

* Implement `askNextQuestion(missingFields)` utility function.
* Map missing profile fields to predefined natural language questions:

  ```js
  const nextQuestionMap = {
    name: "Aapka naam kya hai?",
    age: "Aapki umr kya hai?",
    income: "Aapki monthly income kitni hai?",
    financialGoals: "Aapke financial goals kya hain?",
    location: "Aap kaha rehte ho?",
    occupation: "Aap kya kaam karte ho?"
  };
  ```

### 3.3 Proactive Prompt Engineering

* Update the system prompt in API call to:

  ```
  You are an AI Personal Finance Advisor. If the user hasn't provided complete profile information (name, age, income, goals), start asking relevant questions step-by-step to build their profile. Always ask a follow-up question unless the task is complete.
  ```

### 3.4 Response Augmentation Logic

* Enhance the chatbot controller to append the next relevant question to the AI's response:

  ```js
  if (missingFields.length > 0) {
    const followUp = askNextQuestion(missingFields);
    chatbotReply += `\n\n${followUp}`;
  }
  ```

### 3.5 Optional: Session Memory Enhancement

* Maintain a session object to track which questions have been asked.
* Avoid repeating the same questions.

---

## 4. Technical Stack

* Node.js
* Express.js
* OpenAI/Mistral API (assumed)
* MongoDB (Profile, Session tracking)
* Optional: Redis for faster session caching

---

## 5. Deliverables

* Updated `chatbot.controller.js` with proactive question logic
* Enhanced prompts and response handlers
* Reusable utility functions
* Optional caching/session tracking improvements

---

## 6. Success Criteria

* Chatbot initiates and sustains conversations without waiting for user questions.
* User profiles become more complete over time.
* Increased engagement metrics (average session length, profile fields filled).
* Positive feedback from users testing the proactive version.

---

## 7. Future Enhancements (Optional)

* Use GPT function calling for structured responses
* Add multilingual support
* Integrate with analytics to track drop-offs or confusion points
