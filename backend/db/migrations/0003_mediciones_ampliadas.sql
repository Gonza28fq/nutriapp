-- 0003 · Mediciones ampliadas
-- Perímetros para el cuerpo interactivo y más datos de composición corporal.
-- Ya existían: peso, talla, IMC, cintura, cadera, ICC, % grasa, % magra, presión, FC.

ALTER TABLE mediciones
  ADD COLUMN IF NOT EXISTS perimetro_cuello_cm      numeric(5,1),
  ADD COLUMN IF NOT EXISTS perimetro_brazo_cm       numeric(5,1),
  ADD COLUMN IF NOT EXISTS perimetro_torax_cm       numeric(5,1),
  ADD COLUMN IF NOT EXISTS perimetro_abdomen_cm     numeric(5,1),
  ADD COLUMN IF NOT EXISTS perimetro_muslo_cm       numeric(5,1),
  ADD COLUMN IF NOT EXISTS perimetro_pantorrilla_cm numeric(5,1),
  ADD COLUMN IF NOT EXISTS masa_muscular_kg         numeric(5,2),
  ADD COLUMN IF NOT EXISTS grasa_visceral_nivel     smallint,
  ADD COLUMN IF NOT EXISTS agua_corporal_pct        numeric(5,2);
