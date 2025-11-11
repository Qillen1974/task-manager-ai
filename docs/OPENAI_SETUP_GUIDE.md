# OpenAI Integration Setup Guide

This guide explains how to configure and use OpenAI with your AI Butler chatbot.

## Overview

The AI Butler now supports real AI responses using OpenAI's API. You can configure API keys through the admin panel without any code changes.

## Prerequisites

- TaskQuadrant admin account
- OpenAI API key (if using OpenAI)
- Internet connection to OpenAI API

## Getting Your OpenAI API Key

### Step 1: Create OpenAI Account
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in with your account
3. Verify your email address

### Step 2: Create API Key
1. Navigate to [API Keys page](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Choose a name (e.g., "TaskQuadrant AI Butler")
4. Click "Create secret key"
5. Copy the key immediately (you won't be able to see it again)

### Step 3: Set Billing
1. Go to [Billing Overview](https://platform.openai.com/account/billing/overview)
2. Add a payment method
3. Set up usage limits (optional but recommended)
4. Check pricing at [OpenAI Pricing](https://openai.com/pricing)

## Configuring the AI Butler

### Step 1: Access Admin Panel
1. Go to `/admin` on your TaskQuadrant instance
2. Log in with your admin credentials
3. Click the "AI Butler" tab (🤖)

### Step 2: Configure Model Settings
1. In the "Model Settings" tab:
   - **Select AI Model**: Choose "OpenAI (GPT-4 / GPT-3.5)"
   - **Max Tokens**: Set to 1000 (default) or adjust as needed
     - Lower = shorter responses, faster, cheaper
     - Higher = longer responses, slower, more expensive
   - **Temperature**: 0.7 (default)
     - Lower (0.0-0.3): More focused, deterministic
     - Higher (0.7-1.0): More creative, varied
   - **System Prompt**: Default is provided, customize if desired
   - **Feature Toggles**: Enable bug reporting and KB suggestions

### Step 3: Add API Keys
1. Click the "API Keys" tab
2. Paste your OpenAI API key in the "OpenAI API Key" field
3. Click "Save Configuration"

### Step 4: Test the Integration
1. Go to the dashboard and open the AI Butler chat
2. Send a test message like "What is TaskQuadrant?"
3. You should receive an AI-powered response
4. Check the browser console for any errors

## Features Enabled with OpenAI Integration

### Intelligent Responses
- Responses use actual AI reasoning instead of keyword matching
- Context-aware answers based on your question
- Natural language understanding

### Knowledge Base Integration
- Relevant knowledge base articles are included in the AI context
- Maintains consistency with your documented information
- Falls back to KB if AI API is unavailable

### Bug Detection
- Automatically detects bug/error-related questions
- Suggests bug report submission
- Links users to troubleshooting resources

### Customizable System Prompt
- Define AI behavior and personality
- Set specific guidelines and constraints
- Include company-specific information

## Configuration Options

### Model Selection
- **OpenAI**: GPT-3.5-turbo and GPT-4 (most capable)
- **Anthropic Claude**: Coming soon (placeholder ready)
- **Google Gemini**: Coming soon (placeholder ready)

### Token Limits
```
Recommended: 1000 tokens
- Min: 1 token
- Max: 4000 tokens
- 1 token ≈ 4 characters of text
```

### Temperature Settings
```
0.0  - Most deterministic, focused
0.3  - Balanced, consistent
0.7  - Default, good balance
1.0  - Most creative, varied
```

## Pricing & Costs

### OpenAI Pricing (as of 2024)
- **GPT-3.5-turbo**: $0.50 per 1M input tokens, $1.50 per 1M output tokens
- **GPT-4**: $30 per 1M input tokens, $60 per 1M output tokens

### Cost Estimation
Assuming average message = 100 input + 200 output tokens:
- At 1000 users/month, 5 messages each:
  - GPT-3.5-turbo: ~$0.75/month
  - GPT-4: ~$15/month

### Cost Control
- Set usage limits in OpenAI dashboard
- Monitor token usage in the config panel (future feature)
- Use lower token limits for cost reduction

## Troubleshooting

### "API Key Not Configured" Error
- Go to Admin > AI Butler > API Keys
- Paste your OpenAI API key
- Click "Save Configuration"
- Verify the key is correct and active

### "Authentication Failed" Error
- Check that your API key is valid
- Verify it hasn't expired or been revoked
- Ensure billing is set up in OpenAI dashboard
- Check OpenAI status page for outages

### "No Response" Error
- Verify internet connection
- Check OpenAI API status
- Review rate limits in OpenAI dashboard
- Check server logs for error details

### Slow Responses
- May be normal during high API load
- Try reducing max tokens setting
- Use GPT-3.5-turbo instead of GPT-4
- Check internet connection speed

### Wrong Responses
- Adjust the system prompt for more specific instructions
- Lower temperature for more focused responses
- Add more context to knowledge base articles
- Provide example questions to train behavior

## Best Practices

### Security
- ✅ Never share your API key in chat or forums
- ✅ Rotate keys regularly
- ✅ Set usage limits to prevent overages
- ✅ Monitor OpenAI billing dashboard

### Cost Management
- ✅ Set max token limits appropriately
- ✅ Use temperature 0.7 as default
- ✅ Review usage regularly
- ✅ Set billing alerts

### Quality
- ✅ Maintain updated knowledge base
- ✅ Test responses regularly
- ✅ Adjust system prompt as needed
- ✅ Monitor user satisfaction

### Performance
- ✅ Keep knowledge base articles focused
- ✅ Use relevant keywords for better matching
- ✅ Limit context to top 3 articles
- ✅ Enable response caching (future feature)

## System Prompt Template

If you want to customize the system prompt, here's a template:

```
You are [Company Name]'s AI Butler, a helpful assistant for
[Application Name], a [Brief Description].

Your responsibilities:
1. Help users understand and use [Application] features
2. Answer questions about [specific features]
3. Guide users through common workflows
4. Suggest helpful features based on user needs
5. Detect and suggest bug reporting for issues

Key Information About [Application]:
- [Plan tiers and limits]
- [Main features]
- [Integrations]

Tone and Style:
- Be friendly and professional
- Keep responses concise (under 200 words)
- Use bullet points for clarity
- Suggest knowledge base articles when relevant

Guidelines:
- If you don't know something, be honest and offer to escalate
- Encourage users to read relevant documentation
- Suggest bug reporting for technical issues
```

## API Response Details

### Response Structure
```json
{
  "success": true,
  "data": {
    "conversationId": "conv_123...",
    "response": "The AI butler's response here...",
    "suggestBugReport": false
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Authentication failed for OpenAI API",
    "code": "OPENAI_AUTH_ERROR"
  }
}
```

## Future Enhancements

- [ ] Token usage tracking and cost monitoring
- [ ] Response caching for common questions
- [ ] Multi-model support (Anthropic, Gemini)
- [ ] Conversation export
- [ ] Analytics dashboard
- [ ] Custom model fine-tuning
- [ ] Streaming responses
- [ ] Image support

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review OpenAI API documentation
3. Check application logs for error details
4. Contact your system administrator

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Status Page](https://status.openai.com/)

---

**Last Updated**: November 2024
**Status**: Production Ready
**Support**: OpenAI, Anthropic & Gemini (ready)
