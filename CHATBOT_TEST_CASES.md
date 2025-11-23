# Chatbot Test Cases

## Current Issues to Fix:
1. Ambiguous queries (e.g., "campus housing") should ask for clarification
2. Follow-up numeric responses (e.g., "2") should work correctly
3. Map links should only appear for actual location queries, not housing questions
4. Responses should be complete and comprehensive

## Test Queries:

### Housing Queries (Ambiguous - Should Ask for Clarification)
- "tell me about campus housing"
- "what housing is available"
- "campus housing options"

### Specific Housing Queries (Should Give Direct Answers)
- "tell me about Rider University housing"
- "what is on-campus housing"
- "hotel options"

### Location Queries (Should Include Map)
- "where is the reunion"
- "how do I get to campus"
- "show me the map"

### General Queries
- "when is the reunion"
- "what is the cost"
- "can I bring guests"

## Expected Behavior:

### For Ambiguous Queries:
Should respond with:
```
I found information about multiple topics. Which would you like to know more about?

1. [Topic A]
2. [Topic B]
3. [Topic C]

Please let me know which interests you!
```

Then if user responds "2", should show ONLY Topic B content.

### For Specific Queries:
Should give complete, comprehensive answer immediately.

### For Location Queries:
Should include map link at the end.
