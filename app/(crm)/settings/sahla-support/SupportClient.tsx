"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Phone, Mail, Clock, CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "../../_components/PageHeader";
import { useMosque } from "../../_lib/mock-mosque";
import { relativeShort } from "../../_lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Message = {
  id: string;
  author: "you" | "sahla";
  authorName: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
};

const NOW = new Date("2026-05-08T12:00:00Z").getTime();
const HOUR = 3_600_000;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  author: "sahla",
  authorName: "Sahla Support",
  body:
    "As-salāmu ʿalaykum 👋 Send anything here — bug reports, feature requests, billing questions, or just getting unstuck. Your message reaches our support channel in Slack, and we reply by email at the address on your mosque profile. Usually within an hour, always within 24h.",
  sentAt: new Date(NOW - 72 * HOUR).toISOString(),
};

export default function SupportClient() {
  const mosque = useMosque();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    if (mosque.isHQ) {
      toast("HQ preview — sign in as a mosque admin to send messages.");
      return;
    }

    const optimistic: Message = {
      id: `msg_${Date.now().toString(36)}`,
      author: "you",
      authorName: "You",
      body: text,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/crm/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        deliveredToSlack?: boolean;
        webhookError?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? `Send failed (${res.status})`);
      }
      if (body.deliveredToSlack) {
        toast.success("Message sent — we'll reply by email.");
      } else {
        toast.success("Message recorded — reach us at support@sahla.co if urgent.");
      }
    } catch (err) {
      // Roll back the optimistic message.
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(text);
      toast.error(err instanceof Error ? err.message : "Couldn't send.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Sahla Support"
        description={`Direct line to your Sahla team. We respond within 24h, usually much faster.`}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Chat */}
        <section className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-[#0A261E]/8 bg-white">
          <header className="flex items-center justify-between border-b border-[#0A261E]/6 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#0A261E] text-[12px] font-semibold text-[#fffbf2]">
                SR
                <span
                  aria-label="Online"
                  className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
                />
              </div>
              <div>
                <p className="text-[13.5px] font-semibold text-[#0A261E]">
                  Sara from Sahla
                </p>
                <p className="text-[11px] text-emerald-700">
                  Online · responds within an hour
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#0A261E]/45">
                Mosque
              </p>
              <p className="text-[12px] text-[#0A261E]/65">{mosque.name}</p>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
          </div>

          <footer className="border-t border-[#0A261E]/6 p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder="Type your message… (⌘+Enter to send)"
                className="resize-none"
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Attach file"
                  onClick={() => toast("File uploads coming soon")}
                >
                  <Paperclip size={14} />
                </Button>
                <Button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  size="icon"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </Button>
              </div>
            </div>
          </footer>
        </section>

        {/* Side rail */}
        <aside className="space-y-3">
          <ContactCard
            icon={Mail}
            label="Email"
            value="support@sahla.co"
            href="mailto:support@sahla.co"
          />
          <ContactCard
            icon={Phone}
            label="Phone"
            value="(929) 327-0000"
            href="tel:+19293270000"
          />
          <div className="rounded-2xl border border-[#0A261E]/8 bg-white p-5">
            <div className="flex items-center gap-2">
              <Clock size={13} className="text-[#0A261E]/55" />
              <h3 className="text-[12.5px] font-semibold text-[#0A261E]">
                Response times
              </h3>
            </div>
            <ul className="mt-3 space-y-2 text-[12px] text-[#0A261E]/70">
              <li className="flex items-start gap-2">
                <CheckCheck size={11} className="mt-1 shrink-0 text-emerald-600" />
                Mon–Fri 9–6 ET · within 1 hour
              </li>
              <li className="flex items-start gap-2">
                <CheckCheck size={11} className="mt-1 shrink-0 text-emerald-600" />
                Weekends · within 6 hours
              </li>
              <li className="flex items-start gap-2">
                <CheckCheck size={11} className="mt-1 shrink-0 text-emerald-600" />
                Critical bugs · always within 1 hour
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isYou = message.author === "you";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE }}
      className={cn("flex items-end gap-2", isYou && "flex-row-reverse")}
    >
      {!isYou ? (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0A261E] text-[10.5px] font-semibold text-[#fffbf2]">
          SR
        </div>
      ) : null}
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
          isYou
            ? "bg-[#0A261E] text-[#fffbf2]"
            : "bg-[#fffbf2] text-[#0A261E] ring-1 ring-[#0A261E]/8"
        )}
      >
        <p>{message.body}</p>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isYou ? "text-[#fffbf2]/45" : "text-[#0A261E]/45"
          )}
        >
          {message.authorName} · {relativeShort(message.sentAt)}
        </p>
      </div>
    </motion.div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-[#0A261E]/8 bg-white p-4 transition-shadow hover:shadow-[0_6px_16px_-10px_rgba(10,38,30,0.18)]"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fffbf2] text-[#B8922A]">
        <Icon size={15} strokeWidth={1.6} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#0A261E]/45">
          {label}
        </p>
        <p className="text-[13px] font-semibold text-[#0A261E] group-hover:text-[#0A261E]/85">
          {value}
        </p>
      </div>
    </a>
  );
}
