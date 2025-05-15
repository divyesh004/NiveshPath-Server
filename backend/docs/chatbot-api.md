# NiveshPath Chatbot API Documentation

## Overview

The NiveshPath Chatbot API provides personalized financial advice to users based on their profile information and financial goals. The chatbot leverages Mistral AI to generate responses tailored to each user's specific financial situation.

## Authentication

All chatbot endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Rate Limiting

~~Rate limiting has been removed from the chatbot API to allow unlimited requests.~~

## API Endpoints

### Submit a Query

**POST /api/chatbot/query**

Submit a question to the financial advisor chatbot.

**Request Body:**
```json
{
  "query": "What are the best investment options for a 30-year-old with medium risk appetite?"
}
```

**Response:**
```json
{
  "response": "Based on your medium risk appetite and age of 30, here are some investment options...",
  "sessionId": "60f7b0b9e6b3f32d4c8e7a12"
}
```

### Get Chat History

**GET /api/chatbot/history?limit=10&skip=0**

Retrieve the user's chat history with pagination.

**Query Parameters:**
- `limit` (optional): Number of records to return (default: 10)
- `skip` (optional): Number of records to skip (default: 0)

**Response:**
```json
{
  "chatHistory": [
    {
      "_id": "60f7b0b9e6b3f32d4c8e7a12",
      "userId": "60f7a0a8e6b3f32d4c8e7a10",
      "query": "What are the best investment options for me?",
      "response": "Based on your profile...",
      "timestamp": "2023-07-21T10:30:00.000Z",
      "feedback": {
        "helpful": true,
        "comments": "Very useful advice"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "skip": 0,
    "hasMore": true
  }
}
```

### Get Specific Chat Session

**GET /api/chatbot/session/:sessionId**

Retrieve a specific chat session by ID.

**Response:**
```json
{
  "chatSession": {
    "_id": "60f7b0b9e6b3f32d4c8e7a12",
    "userId": "60f7a0a8e6b3f32d4c8e7a10",
    "query": "What are the best investment options for me?",
    "response": "Based on your profile...",
    "timestamp": "2023-07-21T10:30:00.000Z",
    "context": {
      "userId": "60f7a0a8e6b3f32d4c8e7a10",
      "timestamp": "2023-07-21T10:30:00.000Z",
      "personalization": {
        "riskProfile": "medium",
        "financialGoals": ["retirement", "home purchase"]
      }
    },
    "feedback": null
  }
}
```

### Submit Feedback

**POST /api/chatbot/feedback/:sessionId**

Submit feedback for a specific chat session.

**Request Body:**
```json
{
  "helpful": true,
  "comments": "This advice was very helpful for my financial planning"
}
```

**Response:**
```json
{
  "message": "Feedback submitted successfully",
  "sessionId": "60f7b0b9e6b3f32d4c8e7a12"
}
```

### Delete Chat Session

**DELETE /api/chatbot/session/:sessionId**

Delete a specific chat session.

**Response:**
```json
{
  "message": "Chat session deleted successfully",
  "sessionId": "60f7b0b9e6b3f32d4c8e7a12"
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a message field explaining the error:

```json
{
  "message": "Chat session not found"
}
```

or validation errors:

```json
{
  "errors": [
    {
      "param": "query",
      "msg": "Query is required",
      "location": "body"
    }
  ]
}
```