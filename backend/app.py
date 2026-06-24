"""
Chatting - Backend API Server

A Flask-based proxy server that forwards requests to LLM API providers.
Supports: Anthropic Claude, OpenAI GPT, DeepSeek, GLM (Zhipu),
MiniMax, Doubao (ByteDance), Qwen (Alibaba), Gemini (Google).

Built with care by Claude (Anthropic) for @junhaocheng.
Repository: https://github.com/junhaocheng/chatting

Usage:
  pip install -r requirements.txt
  python app.py
"""

import os
import json
import requests
from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS

# Load .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__, static_folder=None)

# Allow CORS for API routes; restrict origins in production via env var
allowed_origins = os.environ.get('CORS_ORIGINS', '*')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# ---------------------------------------------------------------------------
# Provider configurations
# ---------------------------------------------------------------------------

PROVIDER_META = {
    'anthropic': {
        'name': 'Anthropic (Claude)',
        'api_type': 'anthropic',
        'base_url': 'https://api.anthropic.com/v1/messages',
    },
    'openai': {
        'name': 'OpenAI (GPT)',
        'api_type': 'openai',
        'base_url': 'https://api.openai.com/v1/chat/completions',
    },
    'deepseek': {
        'name': 'DeepSeek',
        'api_type': 'openai',
        'base_url': 'https://api.deepseek.com/v1/chat/completions',
    },
    'glm': {
        'name': 'GLM (Zhipu)',
        'api_type': 'openai',
        'base_url': 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    },
    'minimax': {
        'name': 'MiniMax',
        'api_type': 'openai',
        'base_url': 'https://api.minimax.chat/v1/text/chatcompletion_v2',
    },
    'doubao': {
        'name': 'Doubao (ByteDance)',
        'api_type': 'openai',
        'base_url': 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    },
    'qwen': {
        'name': 'Qwen (Alibaba)',
        'api_type': 'openai',
        'base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    },
    'gemini': {
        'name': 'Gemini (Google)',
        'api_type': 'gemini',
        'base_url': 'https://generativelanguage.googleapis.com/v1beta/models',
    },
}

AVAILABLE_MODELS = {
    'anthropic': [
        {'id': 'claude-sonnet-4-20250514', 'name': 'Claude Sonnet 4'},
        {'id': 'claude-3-5-sonnet-20241022', 'name': 'Claude 3.5 Sonnet'},
        {'id': 'claude-opus-4-20250514', 'name': 'Claude Opus 4'},
        {'id': 'claude-haiku-3-5-20241022', 'name': 'Claude 3.5 Haiku'},
    ],
    'openai': [
        {'id': 'gpt-4o', 'name': 'GPT-4o'},
        {'id': 'gpt-4o-mini', 'name': 'GPT-4o Mini'},
        {'id': 'gpt-4-turbo', 'name': 'GPT-4 Turbo'},
        {'id': 'gpt-3.5-turbo', 'name': 'GPT-3.5 Turbo'},
    ],
    'deepseek': [
        {'id': 'deepseek-chat', 'name': 'DeepSeek Chat'},
        {'id': 'deepseek-coder', 'name': 'DeepSeek Coder'},
    ],
    'glm': [
        {'id': 'glm-4', 'name': 'GLM-4'},
        {'id': 'glm-4-plus', 'name': 'GLM-4 Plus'},
        {'id': 'glm-4-air', 'name': 'GLM-4 Air'},
        {'id': 'glm-4-flash', 'name': 'GLM-4 Flash'},
    ],
    'minimax': [
        {'id': 'MiniMax-Text-01', 'name': 'MiniMax Text-01'},
        {'id': 'abab6.5s-chat', 'name': 'Abab6.5s'},
        {'id': 'abab5.5s-chat', 'name': 'Abab5.5s'},
    ],
    'doubao': [
        {'id': 'doubao-pro-32k', 'name': 'Doubao Pro 32K'},
        {'id': 'doubao-pro-128k', 'name': 'Doubao Pro 128K'},
        {'id': 'doubao-lite-32k', 'name': 'Doubao Lite 32K'},
        {'id': 'doubao-lite-128k', 'name': 'Doubao Lite 128K'},
    ],
    'qwen': [
        {'id': 'qwen-max', 'name': 'Qwen Max'},
        {'id': 'qwen-plus', 'name': 'Qwen Plus'},
        {'id': 'qwen-turbo', 'name': 'Qwen Turbo'},
        {'id': 'qwen2.5-72b-instruct', 'name': 'Qwen2.5 72B'},
        {'id': 'qwen2.5-32b-instruct', 'name': 'Qwen2.5 32B'},
        {'id': 'qwen2.5-14b-instruct', 'name': 'Qwen2.5 14B'},
        {'id': 'qwen2.5-7b-instruct', 'name': 'Qwen2.5 7B'},
    ],
    'gemini': [
        {'id': 'gemini-2.5-flash', 'name': 'Gemini 2.5 Flash'},
        {'id': 'gemini-2.5-pro', 'name': 'Gemini 2.5 Pro'},
        {'id': 'gemini-2.0-flash', 'name': 'Gemini 2.0 Flash'},
    ],
}

# ---------------------------------------------------------------------------
# Frontend static file serving
# ---------------------------------------------------------------------------

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend')


@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/css/<path:filename>')
def css_files(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'css'), filename)


@app.route('/js/<path:filename>')
def js_files(filename):
    return send_from_directory(os.path.join(FRONTEND_DIR, 'js'), filename)


# ---------------------------------------------------------------------------
# API: Health check
# ---------------------------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'app': 'chatting'})


# ---------------------------------------------------------------------------
# API: List available providers
# ---------------------------------------------------------------------------

@app.route('/api/providers', methods=['GET'])
def get_providers():
    providers = [
        {'id': pid, 'name': meta['name']}
        for pid, meta in PROVIDER_META.items()
    ]
    return jsonify({'providers': providers})


# ---------------------------------------------------------------------------
# API: List models for a provider
# ---------------------------------------------------------------------------

@app.route('/api/models', methods=['POST'])
def get_models():
    data = request.get_json() or {}
    provider = data.get('provider', 'anthropic')
    models = AVAILABLE_MODELS.get(provider, [])
    return jsonify({'models': models})


# ---------------------------------------------------------------------------
# API: Verify API key
# ---------------------------------------------------------------------------

@app.route('/api/verify-key', methods=['POST'])
def verify_key():
    data = request.get_json()
    if not data:
        return jsonify({'valid': False, 'error': 'Request body is required'}), 400

    provider = data.get('provider', 'anthropic')
    api_key = data.get('api_key', '')

    if not api_key:
        return jsonify({'valid': False, 'error': 'No API key provided'}), 400

    meta = PROVIDER_META.get(provider)
    if not meta:
        return jsonify({'valid': False, 'error': 'Unsupported provider'}), 400

    try:
        api_type = meta['api_type']

        if api_type == 'anthropic':
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01',
            }
            resp = requests.post(
                meta['base_url'],
                headers=headers,
                json={
                    'model': 'claude-sonnet-4-20250514',
                    'messages': [{'role': 'user', 'content': 'Hi'}],
                    'max_tokens': 1,
                },
                timeout=10,
            )
            return jsonify({'valid': resp.status_code == 200})

        elif api_type == 'openai':
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}',
            }
            resp = requests.post(
                meta['base_url'],
                headers=headers,
                json={
                    'model': AVAILABLE_MODELS[provider][0]['id'],
                    'messages': [{'role': 'user', 'content': 'Hi'}],
                    'max_tokens': 1,
                    'stream': False,
                },
                timeout=10,
            )
            return jsonify({'valid': resp.status_code == 200})

        elif api_type == 'gemini':
            model_id = AVAILABLE_MODELS[provider][0]['id']
            url = f"{meta['base_url']}/{model_id}:generateContent?key={api_key}"
            headers = {'Content-Type': 'application/json'}
            resp = requests.post(
                url,
                headers=headers,
                json={
                    'contents': [{'role': 'user', 'parts': [{'text': 'Hi'}]}],
                },
                timeout=10,
            )
            return jsonify({'valid': resp.status_code == 200})

        return jsonify({'valid': False, 'error': 'Unsupported API type'}), 400

    except requests.exceptions.Timeout:
        return jsonify({'valid': False, 'error': 'Connection timed out'}), 504
    except requests.exceptions.ConnectionError:
        return jsonify({'valid': False, 'error': 'Connection failed'}), 502
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500


# ---------------------------------------------------------------------------
# API: Chat (main endpoint)
# ---------------------------------------------------------------------------

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    provider = data.get('provider', 'anthropic')
    api_key = data.get('api_key', '')
    model = data.get('model', '')
    messages = data.get('messages', [])
    system_prompt = data.get('system', '')
    stream = data.get('stream', True)

    if not api_key:
        return jsonify({'error': 'API key is required'}), 400
    if not messages:
        return jsonify({'error': 'Messages are required'}), 400

    meta = PROVIDER_META.get(provider)
    if not meta:
        return jsonify({'error': f'Unsupported provider: {provider}'}), 400

    api_type = meta['api_type']

    if api_type == 'anthropic':
        return _proxy_anthropic(meta['base_url'], api_key, model, messages, system_prompt, stream)
    elif api_type == 'gemini':
        return _proxy_gemini(meta['base_url'], api_key, model, messages, system_prompt, stream)
    else:
        return _proxy_openai(meta['base_url'], api_key, model, messages, system_prompt, stream)


# ---------------------------------------------------------------------------
# Proxy: Anthropic
# ---------------------------------------------------------------------------

def _proxy_anthropic(base_url, api_key, model, messages, system_prompt, stream):
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': api_key,
        'anthropic-version': '2023-06-01',
    }

    anthropic_messages = []
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        if role != 'system':
            anthropic_messages.append({'role': role, 'content': content})

    payload = {
        'model': model or 'claude-sonnet-4-20250514',
        'messages': anthropic_messages,
        'max_tokens': 8192,
        'stream': stream,
    }
    if system_prompt:
        payload['system'] = system_prompt

    if not stream:
        try:
            resp = requests.post(base_url, headers=headers, json=payload, timeout=120)
            return jsonify(resp.json()), resp.status_code
        except requests.exceptions.RequestException as e:
            return jsonify({'error': str(e)}), 500

    def generate():
        try:
            with requests.post(base_url, headers=headers, json=payload, stream=True, timeout=120) as resp:
                if resp.status_code != 200:
                    yield _sse('error', {'message': _extract_error(resp)})
                    yield _sse('done', {})
                    return
                for line in resp.iter_lines():
                    if not line:
                        continue
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            ev = json.loads(data_str)
                            if ev.get('type') == 'content_block_delta':
                                text = ev.get('delta', {}).get('text', '')
                                if text:
                                    yield _sse('text', {'content': text})
                        except json.JSONDecodeError:
                            continue
                yield _sse('done', {})
        except Exception as e:
            yield _sse('error', {'message': str(e)})
            yield _sse('done', {})

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


# ---------------------------------------------------------------------------
# Proxy: OpenAI-compatible
# ---------------------------------------------------------------------------

def _proxy_openai(base_url, api_key, model, messages, system_prompt, stream):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }

    openai_messages = []
    if system_prompt:
        openai_messages.append({'role': 'system', 'content': system_prompt})
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        openai_messages.append({'role': role, 'content': content})

    payload = {
        'model': model,
        'messages': openai_messages,
        'stream': stream,
    }

    if not stream:
        try:
            resp = requests.post(base_url, headers=headers, json=payload, timeout=120)
            return jsonify(resp.json()), resp.status_code
        except requests.exceptions.RequestException as e:
            return jsonify({'error': str(e)}), 500

    def generate():
        try:
            with requests.post(base_url, headers=headers, json=payload, stream=True, timeout=120) as resp:
                if resp.status_code != 200:
                    yield _sse('error', {'message': _extract_error(resp)})
                    yield _sse('done', {})
                    return
                for line in resp.iter_lines():
                    if not line:
                        continue
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            ev = json.loads(data_str)
                            choices = ev.get('choices', [])
                            if choices:
                                delta = choices[0].get('delta', {})
                                text = delta.get('content', '')
                                if text:
                                    yield _sse('text', {'content': text})
                        except json.JSONDecodeError:
                            continue
                yield _sse('done', {})
        except Exception as e:
            yield _sse('error', {'message': str(e)})
            yield _sse('done', {})

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


# ---------------------------------------------------------------------------
# Proxy: Gemini (Google)
# ---------------------------------------------------------------------------

def _proxy_gemini(base_url, api_key, model, messages, system_prompt, stream):
    url = f"{base_url}/{model}:streamGenerateContent?key={api_key}"
    headers = {'Content-Type': 'application/json'}

    contents = []
    for msg in messages:
        role = msg.get('role', 'user')
        content = msg.get('content', '')
        gemini_role = 'model' if role == 'assistant' else 'user'
        contents.append({'role': gemini_role, 'parts': [{'text': content}]})

    payload = {'contents': contents}
    if system_prompt:
        payload['systemInstruction'] = {'parts': [{'text': system_prompt}]}

    def generate():
        try:
            with requests.post(url, headers=headers, json=payload, stream=True, timeout=120) as resp:
                if resp.status_code != 200:
                    yield _sse('error', {'message': _extract_error(resp)})
                    yield _sse('done', {})
                    return
                for line in resp.iter_lines():
                    if not line:
                        continue
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data_str = line[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            ev = json.loads(data_str)
                            # Gemini returns either an array or a single object
                            candidates = []
                            if isinstance(ev, list):
                                for item in ev:
                                    candidates.extend(item.get('candidates', []))
                            else:
                                candidates = ev.get('candidates', [])

                            for c in candidates:
                                parts = c.get('content', {}).get('parts', [])
                                for part in parts:
                                    text = part.get('text', '')
                                    if text:
                                        yield _sse('text', {'content': text})
                        except json.JSONDecodeError:
                            continue
                yield _sse('done', {})
        except Exception as e:
            yield _sse('error', {'message': str(e)})
            yield _sse('done', {})

    return Response(stream_with_context(generate()), mimetype='text/event-stream',
                    headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'})


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sse(event_type, data):
    payload = json.dumps({'type': event_type, **data})
    return f"data: {payload}\n\n"


def _extract_error(response):
    try:
        body = response.json()
        # Anthropic
        if 'error' in body:
            msg = body['error']
            if isinstance(msg, dict):
                return msg.get('message', str(msg))
            return str(msg)
        # OpenAI / others
        return body.get('error', {}).get('message', response.text)
    except (ValueError, AttributeError):
        return response.text[:500]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_DEBUG', '1').lower() in ('1', 'true', 'yes')
    print()
    print("  Chatting Backend Server")
    print("  " + ("=" * 35))
    print(f"  API:   http://localhost:{port}/api/")
    print(f"  App:   http://localhost:{port}/")
    print(f"  Debug: {debug}")
    print("  " + ("=" * 35))
    app.run(host='0.0.0.0', port=port, debug=debug)
