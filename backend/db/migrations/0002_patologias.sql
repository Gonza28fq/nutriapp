-- 0002 · Patologías por paciente
-- Catálogo + carga manual + una vista que combina tres orígenes:
--   1. lo cargado a mano por la nutricionista (paciente_patologias)
--   2. los flags de historia_clinica (diabetes, hipertensión, dislipemia, etc.)
--   3. el último IMC registrado (sobrepeso / obesidad grado I-II-III), siempre al día

CREATE TABLE IF NOT EXISTS `patologias` (
  `id`        smallint unsigned NOT NULL AUTO_INCREMENT,
  `codigo`    varchar(30)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre`    varchar(80)  COLLATE utf8mb4_unicode_ci NOT NULL,
  `sigla`     varchar(12)  COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `categoria` enum('peso','metabolica','cardiovascular','digestiva','endocrina','otra') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'otra',
  `color`     varchar(7)   COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orden`     smallint unsigned NOT NULL DEFAULT 100,
  `activa`    tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_patologias_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `patologias` (`codigo`, `nombre`, `sigla`, `categoria`, `color`, `orden`) VALUES
  ('sobrepeso',          'Sobrepeso',              NULL,   'peso',           '#f59e9e', 10),
  ('obesidad',           'Obesidad',               NULL,   'peso',           '#e8577e', 20),
  ('diabetes_1',         'Diabetes tipo 1',        'DBT1', 'metabolica',     '#a78bfa', 30),
  ('diabetes_2',         'Diabetes tipo 2',        'DBT2', 'metabolica',     '#8b5cf6', 40),
  ('hipertension',       'Hipertensión arterial',  'HTA',  'cardiovascular', '#fb7185', 50),
  ('dislipemia',         'Dislipemia',             NULL,   'cardiovascular', '#f97316', 60),
  ('hipotiroidismo',     'Hipotiroidismo',         NULL,   'endocrina',      '#38bdf8', 70),
  ('hipertiroidismo',    'Hipertiroidismo',        NULL,   'endocrina',      '#0ea5e9', 80),
  ('celiaquia',          'Celiaquía',              NULL,   'digestiva',      '#facc15', 90),
  ('enfermedad_renal',   'Enfermedad renal',       NULL,   'otra',           '#94a3b8', 100),
  ('anemia',             'Anemia',                 NULL,   'otra',           '#f43f5e', 110),
  ('osteoporosis',       'Osteoporosis',           NULL,   'otra',           '#cbd5e1', 120)
ON DUPLICATE KEY UPDATE `nombre` = VALUES(`nombre`);

CREATE TABLE IF NOT EXISTS `paciente_patologias` (
  `id`                int unsigned NOT NULL AUTO_INCREMENT,
  `paciente_id`       int unsigned NOT NULL,
  `patologia_id`      smallint unsigned NOT NULL,
  `grado`             varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_diagnostico` date DEFAULT NULL,
  `activa`            tinyint(1) NOT NULL DEFAULT 1,
  `notas`             text COLLATE utf8mb4_unicode_ci,
  `creado_en`         datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_paciente_patologia` (`paciente_id`, `patologia_id`),
  KEY `idx_pp_patologia` (`patologia_id`, `activa`),
  CONSTRAINT `fk_pp_paciente`  FOREIGN KEY (`paciente_id`)  REFERENCES `pacientes`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_patologia` FOREIGN KEY (`patologia_id`) REFERENCES `patologias` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Para traer rápido la última medición de cada paciente
CALL nm_add_index('mediciones', 'idx_mediciones_paciente_fecha', '(`paciente_id`, `fecha`, `id`)');

CREATE OR REPLACE VIEW `v_paciente_patologias` AS
  -- 1) cargadas a mano
  SELECT pp.paciente_id, p.id AS patologia_id, p.codigo, p.nombre, p.sigla, p.categoria, p.color,
         pp.grado, pp.fecha_diagnostico, 'manual' AS origen
  FROM paciente_patologias pp
  JOIN patologias p ON p.id = pp.patologia_id
  WHERE pp.activa = 1

  UNION ALL
  -- 2) declaradas en la historia clínica (si no fueron cargadas a mano)
  SELECT x.paciente_id, p.id, p.codigo, p.nombre, p.sigla, p.categoria, p.color,
         NULL, NULL, 'historia_clinica'
  FROM (
    SELECT paciente_id, 'diabetes_1'       AS codigo FROM historia_clinica WHERE tiene_diabetes_1 = 1
    UNION ALL SELECT paciente_id, 'diabetes_2'       FROM historia_clinica WHERE tiene_diabetes_2 = 1
    UNION ALL SELECT paciente_id, 'hipertension'     FROM historia_clinica WHERE tiene_hipertension = 1
    UNION ALL SELECT paciente_id, 'dislipemia'       FROM historia_clinica WHERE tiene_dislipemia = 1
    UNION ALL SELECT paciente_id, 'hipotiroidismo'   FROM historia_clinica WHERE tiene_hipotiroidismo = 1
    UNION ALL SELECT paciente_id, 'hipertiroidismo'  FROM historia_clinica WHERE tiene_hipertiroidismo = 1
    UNION ALL SELECT paciente_id, 'celiaquia'        FROM historia_clinica WHERE tiene_celiaquia = 1
    UNION ALL SELECT paciente_id, 'enfermedad_renal' FROM historia_clinica WHERE tiene_enfermedad_renal = 1
    UNION ALL SELECT paciente_id, 'anemia'           FROM historia_clinica WHERE tiene_anemia = 1
    UNION ALL SELECT paciente_id, 'osteoporosis'     FROM historia_clinica WHERE tiene_osteoporosis = 1
  ) x
  JOIN patologias p ON p.codigo = x.codigo
  WHERE NOT EXISTS (SELECT 1 FROM paciente_patologias pp
                    WHERE pp.paciente_id = x.paciente_id AND pp.patologia_id = p.id)

  UNION ALL
  -- 3) calculadas desde el último IMC (si no fueron cargadas a mano)
  SELECT u.paciente_id, p.id, p.codigo, p.nombre, p.sigla, p.categoria, p.color,
         CASE WHEN u.imc >= 40 THEN 'Grado III' WHEN u.imc >= 35 THEN 'Grado II'
              WHEN u.imc >= 30 THEN 'Grado I' ELSE NULL END,
         u.fecha, 'imc'
  FROM (
    SELECT m.paciente_id, m.imc, m.fecha,
           ROW_NUMBER() OVER (PARTITION BY m.paciente_id ORDER BY m.fecha DESC, m.id DESC) AS rn
    FROM mediciones m
    WHERE m.imc IS NOT NULL
  ) u
  JOIN patologias p ON p.codigo = CASE WHEN u.imc >= 30 THEN 'obesidad' WHEN u.imc >= 25 THEN 'sobrepeso' END
  WHERE u.rn = 1
    AND NOT EXISTS (SELECT 1 FROM paciente_patologias pp
                    WHERE pp.paciente_id = u.paciente_id
                      AND pp.patologia_id IN (SELECT id FROM patologias WHERE codigo IN ('sobrepeso', 'obesidad')));
