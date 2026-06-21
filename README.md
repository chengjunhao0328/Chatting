# Chatting

A desktop-style web application for chatting with large language models. Supports **8 AI providers** with a clean, flat UI and both dark and light themes.

Built with a clear separation between frontend (HTML/CSS/JS) and backend (Python/Flask).

## Supported Providers

| Provider              | API Type            | Models                                      |
| --------------------- | ------------------- | ------------------------------------------- |
| Anthropic (Claude)    | Anthropic Messages  | Claude Sonnet 4, Opus 4, 3.5 Sonnet, Haiku |
| OpenAI (GPT)          | OpenAI-compatible   | GPT-4o, GPT-4o Mini, GPT-4 Turbo           |
| DeepSeek              | OpenAI-compatible   | DeepSeek Chat, DeepSeek Coder               |
| GLM (Zhipu)           | OpenAI-compatible   | GLM-4, GLM-4 Plus, GLM-4 Air, GLM-4 Flash  |
| MiniMax               | OpenAI-compatible   | MiniMax Text-01, Abab6.5s, Abab5.5s        |
| Doubao (ByteDance)    | OpenAI-compatible   | Doubao Pro 32K/128K, Doubao Lite 32K/128K  |
| Qwen (Alibaba)        | OpenAI-compatible   | Qwen Max/Plus/Turbo, Qwen2.5 series         |
| Gemini (Google)       | Gemini API          | Gemini 2.5 Flash/Pro, 2.0 Flash             |

## Features

- **Two modes**: Chat and Code, each with a tailored system prompt
- **Multi-provider**: Switch between 8 AI providers seamlessly
- **Streaming responses**: Real-time token-by-token output
- **Dual themes**: Dark and light mode with persistent preference
- **Flat UI**: Clean, minimal design
- **Hand-drawn icons**: SVG line-art icons throughout the interface
- **Code blocks**: Syntax-highlighted with one-click copy
- **Settings persistence**: API keys and preferences saved locally
- **Keyboard shortcuts**: Enter to send, Shift+Enter for newline, Escape to stop

## Architecture

```
chatting/
├── backend/
│   ├── app.py              # Flask API server (proxy to 8 LLM providers)
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── index.html          # Main HTML structure
│   ├── css/
│   │   └── style.css       # Dark/light theme with flat UI
│   └── js/
│       └── app.js          # Application logic & state management
└── README.md
```

**Separation of concerns:**
- The backend handles all API communication with LLM providers
- The frontend handles UI rendering and user interaction
- They communicate via REST API calls
- The backend can optionally serve the frontend static files for convenience

## Quick Start

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- A modern web browser

### 1. Install Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The server starts at `http://localhost:5001`. It serves both the API and the frontend.

### 2. Open the App

Visit **http://localhost:5001** in your browser.

### 3. Configure

1. Click **Settings** in the sidebar
2. Select your **API Provider** (e.g., Anthropic, OpenAI, DeepSeek)
3. Choose a **Model**
4. Enter your **API Key**
5. Click **Save & Verify**
6. Once connected, start chatting!

### Run Frontend Separately (optional)

```bash
cd frontend
python -m http.server 8080
# Then open http://localhost:8080
```

If serving separately, ensure the `API_BASE` in `frontend/js/app.js` points to your running backend (default: `http://localhost:5001`).

## API Endpoints

| Endpoint            | Method | Description                              |
| ------------------- | ------ | ---------------------------------------- |
| `/api/health`       | GET    | Health check                             |
| `/api/providers`    | GET    | List all supported providers             |
| `/api/models`       | POST   | List models for a provider               |
| `/api/verify-key`   | POST   | Test if an API key is valid              |
| `/api/chat`         | POST   | Send a message (streaming or non-streaming) |

### Chat Request Format

```json
{
    "provider": "anthropic",
    "model": "claude-sonnet-4-20250514",
    "api_key": "sk-ant-...",
    "messages": [
        {"role": "user", "content": "Hello!"}
    ],
    "system": "Optional system prompt",
    "stream": true
}
```

### Chat Response (Streaming)

The response is a Server-Sent Events stream with normalized format:

```
data: {"type": "text", "content": "Hello"}
data: {"type": "text", "content": "! How can"}
data: {"type": "text", "content": " I help you?"}
data: {"type": "done"}
```

## Configuration

Set the `PORT` environment variable to change the backend port:

```bash
PORT=8080 python app.py
```

## Screenshots

> *Screenshots coming soon. Contributions welcome!*

## Tech Stack

**Frontend**
- Vanilla JavaScript (ES6+)
- CSS Custom Properties for theming
- SVG for icons
- No framework or build tools required

**Backend**
- Python 3 + Flask
- Requests library for HTTP
- Flask-CORS for cross-origin support

## Disclaimer
This software is a client-side interface for third-party AI API services. It does not host, store, or generate any AI models itself.

Users are solely responsible for:

- Complying with the Terms of Service of each AI provider used (Anthropic, OpenAI, DeepSeek, Zhipu, MiniMax, ByteDance, Alibaba, Google, etc.)

- Any API usage costs incurred through their own API keys

- The content they send to and receive from third-party AI services

- Ensuring their use of this software complies with applicable laws and regulations

The author and contributors assume no liability for any misuse of this software or violations of third-party terms of service.

## Credits

This project was built collaboratively between the author and AI programming assistants:

- **Human Author**: [@Junhao Cheng](https://github.com/junhaocheng) — responsible for project planning, architecture design, feature specification, code review, and integration testing.
- **AI Assistant (DeepSeek-V4-Flash)**: Provided code generation, implementation suggestions, and troubleshooting during development.
- **AI Tool (Claude Code)**: Assisted with code editing, file management, and development workflow.

All code and design decisions were ultimately reviewed and approved by the human author.

## License

MIT License. See [LICENSE](LICENSE) for details.
