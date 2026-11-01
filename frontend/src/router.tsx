import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth.store";
import Login from "./pages/Login";
import PanelLayout from "./components/layout/PanelLayout";
import Dashboard from "./pages/panel/Dashboard";
import Pacientes from "./pages/panel/Pacientes";
import NuevoPaciente from "./pages/panel/NuevoPaciente";
import DetallePaciente from "./pages/panel/DetallePaciente";
import Turnos from "./pages/panel/Turnos";
import NuevaConsulta from "./pages/panel/NuevaConsulta";
import EditarPaciente from "./pages/panel/EditarPaciente";
import HistoriaClinica from "./pages/panel/HistoriaClinica";
import Anamnesis from "./pages/panel/Anamnesis";
import Planes from "./pages/panel/Planes";
import Consultas from "./pages/panel/Consultas";
import Configuracion from "./pages/panel/Configuracion";
import Estadisticas from "./pages/panel/Estadisticas";
import DetalleConsulta from "./pages/panel/DetallesConsulta";
import Patologias from "./pages/panel/Patologias";
// El sitio público (Inicio, blog) y el blog del panel quedan fuera de esta versión:
// su código (pages/publico, pages/panel/Blog) y sus tablas se conservan para poder reactivarlos.

function RutaPrivada({ children }: { children: React.ReactNode }) {
  const estaAutenticado = useAuthStore((s) => s.estaAutenticado);
  return estaAutenticado() ? <>{children}</> : <Navigate to="/login" replace />;
}

function RutaPublicaSolo({ children }: { children: React.ReactNode }) {
  const estaAutenticado = useAuthStore((s) => s.estaAutenticado);
  return estaAutenticado() ? <Navigate to="/panel" replace /> : <>{children}</>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Raíz: al panel (o al login si no hay sesión) */}
        <Route path="/" element={<Navigate to="/panel" replace />} />

        <Route path="/login" element={<RutaPublicaSolo><Login /></RutaPublicaSolo>} />

        <Route path="/panel" element={<RutaPrivada><PanelLayout /></RutaPrivada>}>
          <Route index                                       element={<Dashboard />} />
          <Route path="pacientes"                            element={<Pacientes />} />
          <Route path="pacientes/nuevo"                      element={<NuevoPaciente />} />
          <Route path="pacientes/:id"                        element={<DetallePaciente />} />
          <Route path="pacientes/:id/editar"                 element={<EditarPaciente />} />
          <Route path="pacientes/:id/historia-clinica"       element={<HistoriaClinica />} />
          <Route path="pacientes/:id/anamnesis"              element={<Anamnesis />} />
          <Route path="pacientes/:pacienteId/consulta/nueva" element={<NuevaConsulta />} />
          <Route path="patologias"                           element={<Patologias />} />
          <Route path="patologias/:codigo"                   element={<Patologias />} />
          <Route path="turnos"                               element={<Turnos />} />
          <Route path="consultas"                            element={<Consultas />} />
          <Route path="consultas/:id"                        element={<DetalleConsulta />} />
          <Route path="planes"                               element={<Planes />} />
          <Route path="configuracion"                        element={<Configuracion />} />
          <Route path="estadisticas"                         element={<Estadisticas />} />
        </Route>

        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
