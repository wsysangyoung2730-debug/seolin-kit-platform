function boot(config) {
  const send = (value) => {
    const message = JSON.stringify({ seolin: 1, ...value });
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
    else parent.postMessage(message, location.origin === 'null' ? '*' : location.origin);
  };
  const data = { ...config.storage };
  const storage = {
    getItem: (key) => Object.hasOwn(data, key) ? data[key] : null,
    setItem(key, value) { data[String(key)] = String(value); send({ type: 'storage', data }); },
    removeItem(key) { delete data[key]; send({ type: 'storage', data }); },
    clear() { Object.keys(data).forEach((key) => delete data[key]); send({ type: 'storage', data }); },
    key: (index) => Object.keys(data)[index] ?? null,
    get length() { return Object.keys(data).length; },
  };
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  addEventListener('seolin-exit', () => send({ type: 'exit' }));
  let disposed = false;
  const streams = new Set(), recognizers = new Set(), audioPlayers = new Set(), audioContexts = new Set();
  if (window.Audio) {
    const RealAudio = window.Audio;
    window.Audio = function (...args) { const audio = new RealAudio(...args); audioPlayers.add(audio); return audio; };
    window.Audio.prototype = RealAudio.prototype;
  }
  for (const name of ['AudioContext', 'webkitAudioContext']) {
    const RealContext = window[name];
    if (RealContext) {
      window[name] = function (...args) { const context = new RealContext(...args); audioContexts.add(context); return context; };
      window[name].prototype = RealContext.prototype;
    }
  }
  const media = navigator.mediaDevices;
  if (media?.getUserMedia) {
    const get = media.getUserMedia.bind(media);
    media.getUserMedia = async (constraints) => {
      if (disposed || (constraints.video && !config.camera) || (constraints.audio && !config.voice)) throw new DOMException('기기 연결 설정에서 허용해 주세요', 'NotAllowedError');
      const stream = await get(constraints);
      if (disposed) { stream.getTracks().forEach((track) => track.stop()); throw new DOMException('화면 종료', 'AbortError'); }
      streams.add(stream);
      return stream;
    };
  }
  window.__seolinDispose = () => {
    disposed = true;
    streams.forEach((stream) => stream.getTracks().forEach((track) => track.stop()));
    recognizers.forEach((rec) => { rec.onend = null; rec.abort(); });
    window.speechSynthesis?.cancel();
    audioPlayers.forEach((audio) => audio.pause());
    audioContexts.forEach((context) => { void context.close().catch(() => {}); });
    document.querySelectorAll('audio,video').forEach((media) => media.pause());
  };
  addEventListener('pagehide', window.__seolinDispose);
  if (!config.voice) {
    window.SpeechRecognition = undefined;
    window.webkitSpeechRecognition = undefined;
  } else if (config.native) {
    class Recognition {
      constructor() { this.listeners = {}; this.on = false; recognizers.add(this); }
      addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); }
      removeEventListener(type, callback) { this.listeners[type] = (this.listeners[type] || []).filter((fn) => fn !== callback); }
      emit(type, payload) {
        const event = { type, target: this, ...payload };
        (this.listeners[type] || []).forEach((fn) => fn(event));
        this['on' + type]?.(event);
      }
      start() {
        if (disposed) return;
        if (this.on) throw new DOMException('이미 듣는 중', 'InvalidStateError');
        this.on = true;
        send({ type: 'speech-start' });
      }
      stop() {
        if (!this.on) return;
        this.on = false;
        if (![...recognizers].some((rec) => rec.on)) send({ type: 'speech-stop' });
        if (!disposed) setTimeout(() => this.emit('end', {}), 0);
      }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = window.webkitSpeechRecognition = Recognition;
    window.__seolinSpeech = (type, payload) => {
      if (disposed) return;
      const listening = [...recognizers].filter((rec) => rec.on);
      listening.forEach((rec) => {
        if (type === 'end') rec.on = false;
        if (type === 'result') {
          const result = [{ transcript: payload.text, confidence: 1 }];
          result.isFinal = payload.final;
          rec.emit(type, { resultIndex: 0, results: [result] });
        } else rec.emit(type, payload || {});
      });
    };
  } else {
    const Real = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (Real) {
      class TrackedRecognition extends Real { constructor() { super(); recognizers.add(this); } }
      window.SpeechRecognition = window.webkitSpeechRecognition = TrackedRecognition;
    }
  }
  if (config.native) {
    class Utterance { constructor(text) { this.text = text; this.lang = 'ko-KR'; this.rate = 1; this.pitch = 1; } }
    window.SpeechSynthesisUtterance = Utterance;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      cancel: () => send({ type: 'tts-stop' }),
      speak: (value) => send({ type: 'tts', text: value.text, rate: value.rate, pitch: value.pitch }),
      getVoices: () => [],
    }});
    document.addEventListener('click', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
      event.preventDefault();
      send({ type: 'files', id: input.id, accept: input.accept, multiple: input.multiple });
    }, true);
    window.__seolinFiles = (id, files) => {
      const input = document.getElementById(id);
      if (!input || disposed) return;
      const transfer = new DataTransfer();
      files.forEach((file) => {
        const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
        transfer.items.add(new File([bytes], file.name, { type: file.type }));
      });
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
  }
  addEventListener('DOMContentLoaded', () => {
    // Keep manual input available even when speech is supported but temporarily unavailable.
    const word = document.getElementById('word');
    if (word) word.classList.remove('hidden');
    if (config.native) {
      const folder = document.getElementById('folderBtn');
      if (folder) folder.textContent = '사진 여러 장 선택';
    }
    send({ type: 'ready' });
  });
}
