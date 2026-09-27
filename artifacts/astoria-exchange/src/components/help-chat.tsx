import { FormEvent, useEffect, useRef, useState } from 'react';
import { HelpCircle, MessageCircle, Send, X } from 'lucide-react';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const suggestions = [
  'How does scoring work?',
  'How do I request pickup?',
  'How do I undo a request?',
];

const starterMessage =
  'Hi — I can help you use Astoria Circular Exchange. Ask me about matches, scoring, business profiles, pickup requests, or undoing a request.';

function answerQuestion(question: string): string {
  const text = question.toLowerCase();

  if (/(score|points|rating|match percentage|100)/.test(text)) {
    return 'Every match is scored out of 100 points: material compatibility is worth 40, distance is worth 40, and pickup timing is worth 20. Open a match card to see the three-part breakdown.';
  }

  if (/(undo|cancel|remove).*(request|pickup)|request.*(undo|cancel)/.test(text)) {
    return 'Open Your matches, find the requested partner, and click Undo request. The match will return to Available and you can request it again later.';
  }

  if (/(request|pickup|collect|drop off|handoff)/.test(text)) {
    return 'Open Your matches and choose Request pickup on an available match. After sending it, the card changes to Requested so you can track the handoff.';
  }

  if (/(match|partner|shortlist|find|nearby|network)/.test(text)) {
    return 'Your matches are ranked local partners. Use the search box, Available or Requested filters, and Best fit sorting to narrow the list. Each card shows the material, distance, timing, and score.';
  }

  if (/(profile|business details|edit|material|address|quantity|timing)/.test(text)) {
    return 'Open Business profile to update your name, type, pickup address, materials, quantity, and pickup window. Save profile to refresh your matches.';
  }

  if (/(join|another business|sign up|add a business|test business)/.test(text)) {
    return 'Open Business profile and click Join as another business. Fill out the form and save it to add another local test profile to the exchange network.';
  }

  if (/(dashboard|overview|home|activity|stats)/.test(text)) {
    return 'Overview is your home screen. It shows your active matches, local partners, diversion stats, recent activity, and your strongest matches.';
  }

  if (/(what is|how does|about|purpose|exchange)/.test(text)) {
    return 'Astoria Circular Exchange helps neighborhood businesses keep useful materials in circulation. Businesses are matched by what they offer, what they need, pickup distance, and timing.';
  }

  return 'I can help with the website’s main actions: finding matches, understanding the 100-point score, updating your business profile, requesting pickup, joining as another business, or undoing a pickup request. What would you like to do?';
}

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: starterMessage },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: question },
      { id: Date.now() + 1, role: 'assistant', text: answerQuestion(question) },
    ]);
    setInput('');
  };

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open && (
        <section
          aria-label="Astoria help assistant"
          className="mb-3 flex h-[min(610px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-[370px] flex-col overflow-hidden rounded-2xl border border-card-border bg-card shadow-[var(--shadow-lg)] sm:w-[370px]"
        >
          <header className="flex items-start justify-between gap-3 bg-secondary px-4 py-4 text-secondary-foreground">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <HelpCircle size={18} />
              </span>
              <div>
                <p className="text-[13px] font-extrabold">Exchange guide</p>
                <p className="mt-0.5 text-[10px] text-secondary-foreground/65">Answers about using this website</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close help assistant"
              data-testid="button-close-help-chat"
              onClick={() => setOpen(false)}
              className="focus-ring rounded-lg p-1.5 text-secondary-foreground/65 transition-colors hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
            >
              <X size={16} />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-background/55 px-3 py-4" aria-live="polite">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[11px] leading-relaxed ${message.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border bg-card text-foreground/80'}`}>
                  {message.text}
                </p>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => useSuggestion(suggestion)}
                    className="focus-ring rounded-full border border-border bg-card px-2.5 py-1.5 text-left text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border bg-card p-3">
            <label className="sr-only" htmlFor="help-chat-input">Ask about using Astoria Circular Exchange</label>
            <input
              id="help-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              data-testid="input-help-chat"
              placeholder="Ask how something works…"
              className="focus-ring h-10 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-[11px] outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              aria-label="Send question"
              data-testid="button-send-help-chat"
              disabled={!input.trim()}
              className="focus-ring grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_5px_14px_hsl(var(--primary)/.25)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        aria-label={open ? 'Close help assistant' : 'Open help assistant'}
        aria-expanded={open}
        data-testid="button-toggle-help-chat"
        onClick={() => setOpen((value) => !value)}
        className={`focus-ring ml-auto flex items-center gap-2 rounded-full px-4 py-3 text-[11px] font-extrabold shadow-[var(--shadow-md)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)] ${open ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}
      >
        {open ? <X size={16} /> : <MessageCircle size={16} />}
        <span>{open ? 'Close guide' : 'Ask the guide'}</span>
      </button>
    </div>
  );
}