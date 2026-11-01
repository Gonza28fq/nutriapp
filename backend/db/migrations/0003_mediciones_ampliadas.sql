-- 0003 · Mediciones ampliadas
-- Perímetros para el cuerpo interactivo y más datos de composición corporal.
-- Ya existían: peso, talla, IMC, cintura, cadera, ICC, % grasa, % magra, presión, FC.

CALL nm_add_column('mediciones', 'perimetro_cuello_cm',      'DECIMAL(5,1) NULL AFTER `indice_cintura_cadera`');
CALL nm_add_column('mediciones', 'perimetro_brazo_cm',       'DECIMAL(5,1) NULL AFTER `perimetro_cuello_cm`');
CALL nm_add_column('mediciones', 'perimetro_torax_cm',       'DECIMAL(5,1) NULL AFTER `perimetro_brazo_cm`');
CALL nm_add_column('mediciones', 'perimetro_abdomen_cm',     'DECIMAL(5,1) NULL AFTER `perimetro_torax_cm`');
CALL nm_add_column('mediciones', 'perimetro_muslo_cm',       'DECIMAL(5,1) NULL AFTER `perimetro_abdomen_cm`');
CALL nm_add_column('mediciones', 'perimetro_pantorrilla_cm', 'DECIMAL(5,1) NULL AFTER `perimetro_muslo_cm`');

CALL nm_add_column('mediciones', 'masa_muscular_kg',     'DECIMAL(5,2) NULL AFTER `porcentaje_masa_magra`');
CALL nm_add_column('mediciones', 'grasa_visceral_nivel', 'TINYINT UNSIGNED NULL AFTER `masa_muscular_kg`');
CALL nm_add_column('mediciones', 'agua_corporal_pct',    'DECIMAL(5,2) NULL AFTER `grasa_visceral_nivel`');

-- El gráfico de progreso trae los laboratorios de un paciente ordenados por fecha
CALL nm_add_index('laboratorios', 'idx_laboratorios_paciente_fecha', '(`paciente_id`, `fecha`)');
