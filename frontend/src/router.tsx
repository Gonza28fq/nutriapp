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
import Blog from "./pages/panel/Blog";
import Configuracion from "./pages/panel/Configuracion";
import Estadisticas from "./pages/panel/Estadisticas";
import DetalleConsulta from "./pages/panel/DetallesConsulta";
// Sitio público
import PublicLayout from "./components/layout/PublicLayout";
import Inicio from "./pages/publico/Inicio";
import BlogPublico from "./pages/publico/BlogPublico";
import PostPublico from "./pages/publico/PostPublico";

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

        {/* ── Sitio público ─────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"           element={<Inicio />} />
          <Route path="/blog"       element={<BlogPublico />} />
          <Route path="/blog/:slug" element={<PostPublico />} />
        </Route>

        {/* ── Login ─────────────────────────────────────── */}
        <Route
          path="/login"
          element={
            <RutaPublicaSolo>
              <Login />
            </RutaPublicaSolo>
          }
        />

        {/* ── Panel privado ─────────────────────────────── */}
        <Route
          path="/panel"
          element={
            <RutaPrivada>
              <PanelLayout />
            </RutaPrivada>
          }
        >
          <Route index                                          element={<Dashboard />} />
          <Route path="pacientes"                               element={<Pacientes />} />
          <Route path="pacientes/nuevo"                         element={<NuevoPaciente />} />
          <Route path="pacientes/:id"                           element={<DetallePaciente />} />
          <Route path="pacientes/:id/editar"                    element={<EditarPaciente />} />
          <Route path="pacientes/:id/historia-clinica"          element={<HistoriaClinica />} />
          <Route path="pacientes/:id/anamnesis"                 element={<Anamnesis />} />
          <Route path="pacientes/:pacienteId/consulta/nueva"    element={<NuevaConsulta />} />
          <Route path="turnos"                                  element={<Turnos />} />
          <Route path="consultas"                               element={<Consultas />} />
          <Route path="planes"                                  element={<Planes />} />
          <Route path="blog"                                    element={<Blog />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="estadisticas" element={<Estadisticas />} />
          <Route path="consultas/:id" element={<DetalleConsulta />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}