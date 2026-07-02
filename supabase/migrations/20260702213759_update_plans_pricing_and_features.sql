INSERT INTO public.plans (name, price, price_mensal, price_anual, billing_period, desconto_anual_percentual, features) VALUES
  ('Fluxo', 49.90, 49.90, 499.00, 'mensal', 16.67, '["Até 100 transações/mês", "Categorias básicas", "1 usuário", "Suporte por e-mail"]'::jsonb),
  ('Lucro', 89.90, 89.90, 899.00, 'mensal', 16.67, '["Transações ilimitadas", "Categorias personalizadas", "Até 3 usuários", "DRE simplificado", "Suporte via WhatsApp"]'::jsonb),
  ('Patrimônio', 199.90, 199.90, 1999.00, 'mensal', 16.67, '["Tudo do plano Lucro", "Usuários ilimitados", "DRE completo", "Valuation", "Suporte dedicado VIP"]'::jsonb)
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  price_mensal = EXCLUDED.price_mensal,
  price_anual = EXCLUDED.price_anual,
  billing_period = EXCLUDED.billing_period,
  desconto_anual_percentual = EXCLUDED.desconto_anual_percentual,
  features = EXCLUDED.features;
