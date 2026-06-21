-- scheduled_notifications — durable queue for outgoing push notifications.
-- ----------------------------------------------------------------------------
-- Every send (immediate OR scheduled) is enqueued here by the auth-gated
-- /api/crm/notifications/send route. The `send-push` edge function is the only
-- thing that delivers: it claims due `pending` rows, resolves the audience to
-- Expo push tokens, POSTs to exp.host, and records the result. Because the
-- enqueue path is the only way to inject content (and it's behind
-- requireCrmAccess), the drain worker can run unauthenticated like the
-- prayer-times cron without an injection surface.
--
-- Applied to staging (rpepxdgdiqeirdqsazuc) only.

CREATE TABLE public.scheduled_notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mosque_id TEXT NOT NULL REFERENCES public.mosques(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- 'tag' is intentionally absent: tagged segments have no backing data yet.
  audience_type TEXT NOT NULL DEFAULT 'all'
    CHECK (audience_type IN ('all', 'program', 'event')),
  audience_target UUID,            -- content_id for program/event; null for 'all'
  audience_label TEXT,
  template_id BIGINT REFERENCES public.notification_templates(id) ON DELETE SET NULL,
  created_by TEXT,                 -- clerk user id of the admin who composed it
  actor_name TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'canceled')),
  recipient_count INT,             -- tokens resolved at delivery time
  sent_count INT,
  failed_count INT,
  activity_log_id UUID,            -- the notification_sent history row
  error TEXT,
  attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  -- program/event sends must name a target; 'all' must not.
  CONSTRAINT scheduled_notifications_target_required
    CHECK (audience_type = 'all' OR audience_target IS NOT NULL)
);

-- Hot path for the drain worker: due, still-pending rows in time order.
CREATE INDEX idx_scheduled_notifications_due
  ON public.scheduled_notifications(scheduled_for)
  WHERE status = 'pending';
CREATE INDEX idx_scheduled_notifications_mosque
  ON public.scheduled_notifications(mosque_id, created_at DESC);

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Service-role (admin client + edge function) bypasses RLS. These policies
-- only matter if a mosque-scoped client ever reads the queue directly.
CREATE POLICY scheduled_notifications_mosque_all ON public.scheduled_notifications
  FOR ALL USING (mosque_id = public.requesting_mosque_id());
CREATE POLICY scheduled_notifications_sahla ON public.scheduled_notifications
  FOR SELECT USING (public.is_sahla_team());
