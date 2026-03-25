import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
import pool from "../config/database";
import { RowDataPacket } from "mysql2";

export const DashboardController = {

  async stats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const primerDiaMes = hoy.slice(0, 7) + "-01";

      const [[{ pacientes_activos }]] = await pool.query<(RowDataPacket & { pacientes_activos: number })[]>(
        "SELECT COUNT(*) as pacientes_activos FROM pacientes WHERE activo = TRUE"
      );
      const [[{ turnos_hoy }]] = await pool.query<(RowDataPacket & { turnos_hoy: number })[]>(
        "SELECT COUNT(*) as turnos_hoy FROM turnos WHERE fecha = ? AND estado != 'cancelado'", [hoy]
      );
      const [[{ consultas_mes }]] = await pool.query<(RowDataPacket & { consultas_mes: number })[]>(
        "SELECT COUNT(*) as consultas_mes FROM consultas WHERE fecha >= ?", [primerDiaMes]
      );
      const [[{ planes_activos }]] = await pool.query<(RowDataPacket & { planes_activos: number })[]>(
        "SELECT COUNT(*) as planes_activos FROM planes WHERE estado = 'activo'"
      );
      const [turnos_proximos] = await pool.query<RowDataPacket[]>(
        `SELECT t.*, p.nombre as paciente_nombre, p.apellido as paciente_apellido, s.nombre as sede_nombre
         FROM turnos t
         LEFT JOIN pacientes p ON t.paciente_id = p.id
         LEFT JOIN sedes s ON t.sede_id = s.id
         WHERE t.fecha = ? AND t.estado = 'pendiente'
         ORDER BY t.hora ASC LIMIT 6`, [hoy]
      );

      res.json({ ok: true, data: { pacientes_activos, turnos_hoy, consultas_mes, planes_activos, turnos_proximos } });
    } catch (error) { next(error); }
  },

  async estadisticas(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { desde, hasta } = req.query as { desde: string; hasta: string };
      if (!desde || !hasta) {
        res.status(400).json({ ok: false, mensaje: "Se requiere desde y hasta" });
        return;
      }

      const [pacientesPorMes] = await pool.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(creado_en, '%Y-%m') as mes, COUNT(*) as total
         FROM pacientes WHERE creado_en BETWEEN ? AND ?
         GROUP BY mes ORDER BY mes ASC`,
        [desde + " 00:00:00", hasta + " 23:59:59"]
      );

      const [consultasPorMes] = await pool.query<RowDataPacket[]>(
        `SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, COUNT(*) as total
         FROM consultas WHERE fecha BETWEEN ? AND ?
         GROUP BY mes ORDER BY mes ASC`,
        [desde, hasta]
      );

      const [consultasPorTipo] = await pool.query<RowDataPacket[]>(
        `SELECT tipo_consulta, COUNT(*) as total
         FROM consultas WHERE fecha BETWEEN ? AND ?
         GROUP BY tipo_consulta`,
        [desde, hasta]
      );

      const [turnosPorEstado] = await pool.query<RowDataPacket[]>(
        `SELECT estado, COUNT(*) as total
         FROM turnos WHERE fecha BETWEEN ? AND ?
         GROUP BY estado`,
        [desde, hasta]
      );

      const [pacientesPorSexo] = await pool.query<RowDataPacket[]>(
        `SELECT COALESCE(sexo, 'no_especificado') as sexo, COUNT(*) as total
         FROM pacientes WHERE activo = TRUE GROUP BY sexo`
      );

      const [pacientesPorEdad] = await pool.query<RowDataPacket[]>(
        `SELECT
           CASE
             WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) < 18 THEN 'Menor 18'
             WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
             WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 31 AND 45 THEN '31-45'
             WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 46 AND 60 THEN '46-60'
             WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) > 60 THEN 'Mayor 60'
             ELSE 'Sin datos'
           END as rango,
           COUNT(*) as total
         FROM pacientes WHERE activo = TRUE
         GROUP BY rango
         ORDER BY MIN(TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()))`
      );

      const [planesPorEstado] = await pool.query<RowDataPacket[]>(
        `SELECT estado, COUNT(*) as total FROM planes GROUP BY estado`
      );

      const [[totPacientes]]  = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM pacientes WHERE activo = TRUE");
      const [[totConsultas]]  = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM consultas WHERE fecha BETWEEN ? AND ?", [desde, hasta]);
      const [[totTurnos]]     = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM turnos WHERE fecha BETWEEN ? AND ?", [desde, hasta]);
      const [[totPresentes]]  = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM turnos WHERE fecha BETWEEN ? AND ? AND estado = 'presente'", [desde, hasta]);

      res.json({
        ok: true,
        data: {
          pacientesPorMes,
          consultasPorMes,
          consultasPorTipo,
          turnosPorEstado,
          pacientesPorSexo,
          pacientesPorEdad,
          planesPorEstado,
          totales: {
            pacientes:  (totPacientes as any).total,
            consultas:  (totConsultas as any).total,
            turnos:     (totTurnos    as any).total,
            asistencia: (totTurnos as any).total > 0
              ? Math.round(((totPresentes as any).total / (totTurnos as any).total) * 100)
              : 0,
          }
        }
      });
    } catch (error) { next(error); }
  },
};