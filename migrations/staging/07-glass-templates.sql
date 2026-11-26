-- Glass templates (Master DB). Additive and idempotent; normal backend startup inserts the same rows. Assignments and allowances are not touched.
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT pg_advisory_xact_lock(742918);
SET LOCAL search_path TO knockout_master, pg_catalog;
INSERT INTO ui_templates (code,name,preview) VALUES
  ('glass-light','Glass Light','{"description":"Frosted white panels over a pale sky wash, with a floating sidebar and tiled dashboard.","layout":"floating","colors":["#0B57C5","#7FA8E8","#EDF2FA","#FFFFFF"]}'::jsonb),
  ('glass-dark','Glass Dark','{"description":"Smoked graphite glass with a soft blue light. Live work comes first.","layout":"floating","colors":["#262C37","#8AB4FF","#0C0F14","#171B22"]}'::jsonb),
  ('midnight-glass','Midnight Glass','{"description":"Deep indigo glass with violet light, an icon rail and an editorial dashboard.","layout":"rail","colors":["#1E2550","#A9A4FF","#080A1C","#171C3B"]}'::jsonb),
  ('royal-gold-glass','Royal Gold Glass','{"description":"Aubergine glass edged in antique gold, with a masthead and serif headings.","layout":"masthead","colors":["#352444","#DDBB72","#140C1C","#291C35"]}'::jsonb),
  ('aurora-glass','Aurora Glass','{"description":"Teal and violet light over deep ink, with a floating sidebar and two-column dashboard.","layout":"floating","colors":["#163442","#5BE0BE","#061219","#112833"]}'::jsonb)
ON CONFLICT (code) DO NOTHING;
COMMIT;
