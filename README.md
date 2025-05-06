# Multi-Model Medical Assistant Backend

This is the backend server for the Medical Assistant AI chatbot. It handles processing text messages, images, PDFs, and CSV files, sending them to various AI models, and returning the responses to the frontend.

## Features

- Processes text messages from the frontend
- Handles image uploads and sends them to AI models
- Extracts text from PDF files for analysis
- Parses CSV data for health information analysis
- Streams AI responses back to the frontend
- Supports multiple AI providers:
  - OpenAI (GPT-4o)
  - Grok (Grok-2)
  - Anthropic (Claude)
  - DeepSeek (DeepSeek Reasoner)

## Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Create a `.env` file with the following variables:
   \`\`\`
   # Choose your AI provider
   AI_PROVIDER=openai  # Options: openai, grok, anthropic, deepseek
   
   # API Keys (add the ones you need)
   OPENAI_API_KEY=your_openai_api_key_here
   GROK_API_KEY=your_grok_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   
   # Server Configuration
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   \`\`\`
4. Build the project:
   \`\`\`
   npm run build
   \`\`\`
5. Start the server:
   \`\`\`
   npm start
   \`\`\`

## API Endpoints

### POST /api/chat

Main endpoint for chat functionality. Accepts:
- Text messages
- Image files
- PDF files
- CSV files

Returns a streamed response from the selected AI model.

### GET /api/provider

Returns information about the currently configured AI provider and model.

### GET /health

Health check endpoint to verify the server is running.

## Switching AI Providers

To switch between AI providers, simply change the `AI_PROVIDER` environment variable to one of:
- `openai` (default)
- `grok`
- `anthropic`
- `deepseek`

Make sure you have the corresponding API key set in your environment variables.

## Frontend Integration

Update your frontend to send requests to this backend server instead of directly to the AI provider. See the `frontend-integration.ts` file for guidance.

## Environment Variables

- `AI_PROVIDER`: The AI provider to use (openai, grok, anthropic, deepseek)
- `OPENAI_API_KEY`: Your OpenAI API key
- `GROK_API_KEY`: Your Grok API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `DEEPSEEK_API_KEY`: Your DeepSeek API key
- `PORT`: The port the server will run on (default: 3001)
- `FRONTEND_URL`: The URL of your frontend for CORS configuration
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 10MB)

## License

MIT
