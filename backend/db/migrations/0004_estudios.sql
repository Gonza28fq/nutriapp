-- 0004 · Estudios del paciente
-- Registro de los estudios que se hizo el paciente (sin archivos por ahora).
-- Si es un laboratorio con valores cargados, se vincula a la fila de `laboratorios`.

CREATE TABLE IF NOT EXISTS `estudios` (
  `id`                int unsigned NOT NULL AUTO_INCREMENT,
  `paciente_id`       int unsigned NOT NULL,
  `consulta_id`       int unsigned DEFAULT NULL,
  `laboratorio_id`    int unsigned DEFAULT NULL,
  `tipo`              enum('laboratorio','imagen','cardiologico','bioimpedancia','densitometria','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'laboratorio',
  `nombre`            varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha`             date NOT NULL,
  `lugar`             varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `solicitado_por`    varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resultado_resumen` text COLLATE utf8mb4_unicode_ci,
  `creado_en`         datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_estudios_paciente_fecha` (`paciente_id`, `fecha`),
  CONSTRAINT `fk_estudios_paciente`    FOREIGN KEY (`paciente_id`)    REFERENCES `pacientes`    (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_estudios_consulta`    FOREIGN KEY (`consulta_id`)    REFERENCES `consultas`    (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_estudios_laboratorio` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
