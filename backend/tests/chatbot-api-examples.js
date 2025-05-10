/**
 * Chatbot API Usage Examples
 * 
 * This file demonstrates how to use the NiveshPath Chatbot API
 * with various examples for different endpoints.
 */

// Example: Submit a query to the chatbot
async function submitChatbotQuery() {
  try {
    const response = await fetch('/api/chatbot/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify({
        query: 'What are the best investment options for me?'
      })
    });

    const data = await response.json();
    console.log('Chatbot response:', data.response);
    console.log('Session ID:', data.sessionId);
    console.log('Conversation ID:', data.conversationId);
    
    // Store the conversation ID for follow-up questions
    return data.conversationId;
  } catch (error) {
    console.error('Error submitting query:', error);
  }
}

// Example: Submit a follow-up question in the same conversation
async function submitFollowUpQuery(conversationId) {
  try {
    const response = await fetch('/api/chatbot/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify({
        query: 'How much should I invest monthly?',
        conversationId: conversationId // Include the conversation ID for context
      })
    });

    const data = await response.json();
    console.log('Follow-up response:', data.response);
  } catch (error) {
    console.error('Error submitting follow-up query:', error);
  }
}

// Example: Get chat history
async function getChatHistory() {
  try {
    const response = await fetch('/api/chatbot/history?limit=5&skip=0', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    const data = await response.json();
    console.log('Chat history:', data.chatHistory);
    console.log('Pagination:', data.pagination);
  } catch (error) {
    console.error('Error getting chat history:', error);
  }
}

// Example: Get a specific chat session
async function getChatSession(sessionId) {
  try {
    const response = await fetch(`/api/chatbot/session/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    const data = await response.json();
    console.log('Chat session:', data.chatSession);
  } catch (error) {
    console.error('Error getting chat session:', error);
  }
}

// Example: Submit feedback for a chat session
async function submitFeedback(sessionId) {
  try {
    const response = await fetch(`/api/chatbot/feedback/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      },
      body: JSON.stringify({
        helpful: true,
        comments: 'This advice was very helpful!',
        rating: 5 // Rating from 1-5
      })
    });

    const data = await response.json();
    console.log('Feedback submitted:', data.message);
    console.log('Feedback details:', data.feedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
  }
}

// Example: Delete a chat session
async function deleteChatSession(sessionId) {
  try {
    const response = await fetch(`/api/chatbot/session/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN'
      }
    });

    const data = await response.json();
    console.log('Session deleted:', data.message);
  } catch (error) {
    console.error('Error deleting chat session:', error);
  }
}

// Example usage flow
async function demonstrateChatbotFlow() {
  // Step 1: Submit initial query
  const conversationId = await submitChatbotQuery();
  
  // Step 2: Submit a follow-up question in the same conversation
  await submitFollowUpQuery(conversationId);
  
  // Step 3: Get chat history
  await getChatHistory();
  
  // Note: For the remaining examples, you would need an actual sessionId
  // which would be obtained from the response of submitChatbotQuery()
  const sessionId = 'EXAMPLE_SESSION_ID'; // Replace with actual ID
  
  // Step 4: Get specific chat session
  await getChatSession(sessionId);
  
  // Step 5: Submit feedback
  await submitFeedback(sessionId);
  
  // Step 6: Delete session (optional)
  // await deleteChatSession(sessionId);
}

// Run the demonstration
// demonstrateChatbotFlow();