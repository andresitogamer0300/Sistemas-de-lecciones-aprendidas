/* ============================================================
   SILA — Sistema de Lecciones Aprendidas
   script.js
   Toda la lógica funcional del sistema usando LocalStorage.
   Comentado en español para facilitar el estudio del código.
   ============================================================ */

/* ---------- Llaves de almacenamiento ---------- */
const KEY_LECCIONES = 'sila_lecciones';
const KEY_PROYECTOS = 'sila_proyectos';

/* ---------- Estado en memoria (se sincroniza con LocalStorage) ---------- */
let lecciones = [];
let proyectos = [];
let editandoLeccionId = null; // si no es null, el formulario está editando esa lección
let proyectoSeleccionadoId = null; // proyecto que se está mostrando en el modal

/* Palabras muy comunes que ignoramos al comparar textos (para las recomendaciones) */
const PALABRAS_VACIAS = ['de', 'la', 'el', 'en', 'y', 'a', 'los', 'las', 'un', 'una', 'con', 'para',
  'por', 'se', 'que', 'no', 'del', 'al', 'lo', 'su', 'sus', 'fue', 'ser', 'muy', 'más', 'como'];

/* ============================================================
   INICIALIZACIÓN
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  cargarDatos();
  if (proyectos.length === 0 && lecciones.length === 0) {
    cargarDatosDeEjemplo();
  }
  configurarNavegacion();
  configurarFormularioLeccion();
  configurarConsulta();
  configurarProyectos();
  configurarModales();
  refrescarTodo();
  document.getElementById('f-fecha').value = hoyISO();
});

/* ---------- Carga / guardado en LocalStorage ---------- */

function cargarDatos() {
  lecciones = JSON.parse(localStorage.getItem(KEY_LECCIONES) || '[]');
  proyectos = JSON.parse(localStorage.getItem(KEY_PROYECTOS) || '[]');
}

function guardarLecciones() {
  localStorage.setItem(KEY_LECCIONES, JSON.stringify(lecciones));
}

function guardarProyectos() {
  localStorage.setItem(KEY_PROYECTOS, JSON.stringify(proyectos));
}

/* ---------- Datos de ejemplo (solo la primera vez que se abre la página) ---------- */

function cargarDatosDeEjemplo() {
  proyectos = [
    {
      id: 'p1',
      nombre: 'Sistema de Gestión de Aprendices',
      descripcion: 'Plataforma interna para el seguimiento de aprendices del SENA.',
      responsable: 'Laura Gómez',
      fechaInicio: '2025-02-01',
      fechaFin: '2025-06-30',
      estado: 'Finalizado'
    },
    {
      id: 'p2',
      nombre: 'Plataforma de Ventas',
      descripcion: 'Módulo de ventas en línea para clientes externos.',
      responsable: 'Carlos Rey',
      fechaInicio: '2025-04-10',
      fechaFin: '',
      estado: 'En ejecución'
    }
  ];

  lecciones = [
    {
      id: 'l1',
      proyecto: 'p1',
      categoria: 'Programación',
      tipo: 'Problema',
      descripcion: 'Se presentaron errores durante la integración de algunos módulos.',
      causa: 'No se realizaron suficientes pruebas antes de integrar los módulos.',
      solucion: 'Realizar pruebas individuales antes de integrar cada módulo.',
      buenasPracticas: '',
      recomendacion: 'Implementar pruebas durante cada etapa del desarrollo.',
      impacto: 'Medio',
      responsable: 'Laura Gómez',
      fecha: '2025-05-12',
      aplicada: true
    },
    {
      id: 'l2',
      proyecto: 'p2',
      categoria: 'Tiempos de entrega',
      tipo: 'Problema',
      descripcion: 'Se presentaron retrasos en algunas actividades del cronograma.',
      causa: 'Mala distribución de tareas entre el equipo.',
      solucion: 'Reorganizar las responsabilidades del equipo.',
      buenasPracticas: '',
      recomendacion: 'Definir responsables y fechas desde el inicio del proyecto.',
      impacto: 'Alto',
      responsable: 'Carlos Rey',
      fecha: '2025-06-02',
      aplicada: false
    },
    {
      id: 'l3',
      proyecto: 'p1',
      categoria: 'Tiempos de entrega',
      tipo: 'Problema',
      descripcion: 'El equipo tuvo problemas para cumplir con las fechas de entrega planeadas.',
      causa: 'Estimaciones de tiempo poco realistas.',
      solucion: 'Ajustar el cronograma con tiempos de holgura.',
      buenasPracticas: '',
      recomendacion: 'Incluir margen de tiempo en cada entrega.',
      impacto: 'Medio',
      responsable: 'Laura Gómez',
      fecha: '2025-04-20',
      aplicada: true
    },
    {
      id: 'l4',
      proyecto: 'p2',
      categoria: 'Comunicación',
      tipo: 'Buena práctica',
      descripcion: 'Las reuniones diarias cortas ayudaron a detectar bloqueos a tiempo.',
      causa: '',
      solucion: '',
      buenasPracticas: 'Reuniones diarias de 10 minutos para reportar avances y bloqueos.',
      recomendacion: 'Mantener las reuniones diarias en todos los proyectos.',
      impacto: 'Bajo',
      responsable: 'Carlos Rey',
      fecha: '2025-06-15',
      aplicada: true
    }
  ];

  guardarProyectos();
  guardarLecciones();
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function generarId() {
  return 'id' + Date.now() + Math.floor(Math.random() * 1000);
}

/* ============================================================
   NAVEGACIÓN ENTRE SECCIONES
   ============================================================ */

function configurarNavegacion() {
  const botones = document.querySelectorAll('.nav-item');
  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      botones.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById('view-' + btn.dataset.view).classList.add('active');

      document.getElementById('sidebar').classList.remove('open');

      if (btn.dataset.view === 'dashboard') renderDashboard();
      if (btn.dataset.view === 'reportes') renderReportes();
    });
  });

  document.getElementById('mobileToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
}

/* Vuelve a dibujar todas las secciones (se llama tras cualquier cambio en los datos) */
function refrescarTodo() {
  renderDashboard();
  renderSelectProyectos();
  renderConsulta();
  renderProyectos();
  renderReportes();
}

/* ============================================================
   UTILIDADES DE TEXTO / CATEGORÍAS
   ============================================================ */

function nombreProyecto(id) {
  const p = proyectos.find(pr => pr.id === id);
  return p ? p.nombre : '(proyecto eliminado)';
}

function claseImpacto(impacto) {
  if (impacto === 'Bajo') return 'tag-bajo';
  if (impacto === 'Medio') return 'tag-medio';
  return 'tag-alto';
}

function claseEstado(estado) {
  if (estado === 'En planificación') return 'status-planificacion';
  if (estado === 'En ejecución') return 'status-ejecucion';
  return 'status-finalizado';
}

/* Extrae palabras significativas de un texto, para comparar experiencias similares */
function extraerPalabrasClave(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 3 && !PALABRAS_VACIAS.includes(p));
}

/* Calcula cuántas palabras clave tienen en común dos textos */
function contarCoincidencias(palabrasA, palabrasB) {
  const setB = new Set(palabrasB);
  return palabrasA.filter(p => setB.has(p)).length;
}

/* ============================================================
   DASHBOARD
   ============================================================ */

function renderDashboard() {
  document.getElementById('kpiTotalLecciones').textContent = lecciones.length;
  document.getElementById('kpiProyectos').textContent = proyectos.length;
  document.getElementById('kpiAplicadas').textContent = lecciones.filter(l => l.aplicada).length;

  const recurrentes = detectarProblemasRecurrentes();
  document.getElementById('kpiRecurrentes').textContent = recurrentes.length;

  pintarBarras('chartCategorias', contarPorCampo('categoria'));
  pintarBarras('chartProyectos', contarLeccionesPorProyecto());
  pintarRecurrentes('recurrentesList', recurrentes);
}

/* Cuenta cuántas lecciones hay por cada valor de un campo (ej: categoria) */
function contarPorCampo(campo) {
  const conteo = {};
  lecciones.forEach(l => {
    conteo[l[campo]] = (conteo[l[campo]] || 0) + 1;
  });
  return conteo;
}

function contarLeccionesPorProyecto() {
  const conteo = {};
  lecciones.forEach(l => {
    const nombre = nombreProyecto(l.proyecto);
    conteo[nombre] = (conteo[nombre] || 0) + 1;
  });
  return conteo;
}

/* Dibuja un gráfico de barras horizontal sencillo con divs, sin librerías */
function pintarBarras(contenedorId, datosObj) {
  const contenedor = document.getElementById(contenedorId);
  const entradas = Object.entries(datosObj).sort((a, b) => b[1] - a[1]);

  if (entradas.length === 0) {
    contenedor.innerHTML = '<p class="chart-empty">Aún no hay datos suficientes.</p>';
    return;
  }

  const max = Math.max(...entradas.map(e => e[1]));
  contenedor.innerHTML = entradas.map(([etiqueta, valor]) => `
    <div class="bar-row">
      <span class="bar-row-label" title="${etiqueta}">${etiqueta}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(valor / max) * 100}%"></div></div>
      <span class="bar-row-value">${valor}</span>
    </div>
  `).join('');
}

/* ---------- Detección de problemas recurrentes ----------
   Regla: agrupamos las lecciones de tipo "Problema" por categoría y buscamos
   además coincidencias de palabras clave entre descripciones de categorías
   distintas. Si una categoría (o un grupo de palabras clave) aparece en 2 o
   más lecciones distintas, se considera un problema recurrente. */
function detectarProblemasRecurrentes() {
  const problemas = lecciones.filter(l => l.tipo === 'Problema');
  const porCategoria = {};

  problemas.forEach(l => {
    if (!porCategoria[l.categoria]) porCategoria[l.categoria] = [];
    porCategoria[l.categoria].push(l);
  });

  const recurrentes = [];
  Object.entries(porCategoria).forEach(([categoria, lista]) => {
    if (lista.length >= 2) {
      recurrentes.push({
        etiqueta: categoria,
        cantidad: lista.length,
        proyectos: [...new Set(lista.map(l => nombreProyecto(l.proyecto)))]
      });
    }
  });

  return recurrentes.sort((a, b) => b.cantidad - a.cantidad);
}

function pintarRecurrentes(contenedorId, recurrentes) {
  const contenedor = document.getElementById(contenedorId);
  if (recurrentes.length === 0) {
    contenedor.innerHTML = '<p class="chart-empty">No se han detectado problemas recurrentes todavía.</p>';
    return;
  }
  contenedor.innerHTML = recurrentes.map(r => `
    <div class="recurrente-item">
      <div>
        <strong>${r.etiqueta}</strong><br>
        <span>Presente en: ${r.proyectos.join(', ')}</span>
      </div>
      <span class="recurrente-count">${r.cantidad} veces</span>
    </div>
  `).join('');
}

/* ============================================================
   REGISTRAR LECCIÓN
   ============================================================ */

function configurarFormularioLeccion() {
  const form = document.getElementById('formLeccion');
  const descripcion = document.getElementById('f-descripcion');
  const categoria = document.getElementById('f-categoria');

  // Sugerencias en vivo mientras el usuario describe el problema
  descripcion.addEventListener('input', () => mostrarSugerencias(descripcion.value, categoria.value));
  categoria.addEventListener('change', () => mostrarSugerencias(descripcion.value, categoria.value));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    guardarLeccionDesdeFormulario();
  });

  document.getElementById('btnLimpiar').addEventListener('click', () => {
    limpiarFormularioLeccion();
  });
}

function mostrarSugerencias(textoDescripcion, categoriaActual) {
  const box = document.getElementById('suggestionsBox');
  const lista = document.getElementById('suggestionsList');
  const titulo = document.getElementById('suggestionsTitle');

  const palabrasNuevas = extraerPalabrasClave(textoDescripcion);
  if (palabrasNuevas.length === 0) { box.hidden = true; return; }

  const candidatas = lecciones
    .filter(l => l.id !== editandoLeccionId)
    .map(l => {
      const palabrasExistentes = extraerPalabrasClave(l.descripcion);
      let puntaje = contarCoincidencias(palabrasNuevas, palabrasExistentes);
      if (categoriaActual && l.categoria === categoriaActual) puntaje += 1; // misma categoría suma relevancia
      return { leccion: l, puntaje };
    })
    .filter(c => c.puntaje >= 2)
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, 3);

  if (candidatas.length === 0) { box.hidden = true; return; }

  titulo.textContent = `Se encontraron ${candidatas.length} experiencia(s) similares`;
  lista.innerHTML = candidatas.map(c => `
    <div class="suggestion-item">
      <b>${nombreProyecto(c.leccion.proyecto)}</b> · ${c.leccion.categoria}<br>
      Problema anterior: ${c.leccion.descripcion}<br>
      ${c.leccion.solucion ? 'Solución utilizada: ' + c.leccion.solucion + '<br>' : ''}
      ${c.leccion.recomendacion ? 'Recomendación: ' + c.leccion.recomendacion : ''}
    </div>
  `).join('');
  box.hidden = false;
}

function guardarLeccionDesdeFormulario() {
  const proyecto = document.getElementById('f-proyecto').value;
  const categoria = document.getElementById('f-categoria').value;
  const tipo = document.querySelector('input[name="f-tipo"]:checked').value;
  const impacto = document.getElementById('f-impacto').value;
  const responsable = document.getElementById('f-responsable').value.trim();
  const fecha = document.getElementById('f-fecha').value;
  const descripcion = document.getElementById('f-descripcion').value.trim();
  const causa = document.getElementById('f-causa').value.trim();
  const solucion = document.getElementById('f-solucion').value.trim();
  const buenasPracticas = document.getElementById('f-buenaspracticas').value.trim();
  const recomendacion = document.getElementById('f-recomendacion').value.trim();

  const msg = document.getElementById('formMsg');

  // Validación de campos obligatorios
  if (!proyecto || !categoria || !impacto || !responsable || !fecha || !descripcion) {
    msg.textContent = 'Por favor completa todos los campos obligatorios (*).';
    msg.className = 'form-msg error';
    return;
  }

  if (editandoLeccionId) {
    // Actualizar lección existente
    const leccion = lecciones.find(l => l.id === editandoLeccionId);
    Object.assign(leccion, { proyecto, categoria, tipo, impacto, responsable, fecha, descripcion, causa, solucion, buenasPracticas, recomendacion });
    msg.textContent = 'Lección actualizada correctamente.';
  } else {
    // Crear nueva lección
    lecciones.push({
      id: generarId(), proyecto, categoria, tipo, impacto, responsable, fecha,
      descripcion, causa, solucion, buenasPracticas, recomendacion, aplicada: false
    });
    msg.textContent = 'Lección registrada correctamente.';
  }

  msg.className = 'form-msg success';
  guardarLecciones();
  limpiarFormularioLeccion();
  refrescarTodo();

  setTimeout(() => { msg.textContent = ''; }, 3500);
}

function limpiarFormularioLeccion() {
  document.getElementById('formLeccion').reset();
  document.getElementById('f-fecha').value = hoyISO();
  document.getElementById('suggestionsBox').hidden = true;
  editandoLeccionId = null;
  document.querySelector('#formLeccion button[type="submit"]').textContent = 'Registrar lección';
}

/* Rellena el formulario de registro con los datos de una lección para editarla */
function editarLeccion(id) {
  const l = lecciones.find(x => x.id === id);
  if (!l) return;

  editandoLeccionId = id;
  document.getElementById('f-proyecto').value = l.proyecto;
  document.getElementById('f-categoria').value = l.categoria;
  document.querySelector(`input[name="f-tipo"][value="${l.tipo}"]`).checked = true;
  document.getElementById('f-impacto').value = l.impacto;
  document.getElementById('f-responsable').value = l.responsable;
  document.getElementById('f-fecha').value = l.fecha;
  document.getElementById('f-descripcion').value = l.descripcion;
  document.getElementById('f-causa').value = l.causa || '';
  document.getElementById('f-solucion').value = l.solucion || '';
  document.getElementById('f-buenaspracticas').value = l.buenasPracticas || '';
  document.getElementById('f-recomendacion').value = l.recomendacion || '';

  document.querySelector('#formLeccion button[type="submit"]').textContent = 'Actualizar lección';

  // Cambiar a la vista de registro
  document.querySelector('.nav-item[data-view="registrar"]').click();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function eliminarLeccion(id) {
  if (!confirm('¿Eliminar esta lección? Esta acción no se puede deshacer.')) return;
  lecciones = lecciones.filter(l => l.id !== id);
  guardarLecciones();
  refrescarTodo();
  cerrarModal();
}

function alternarAplicada(id) {
  const l = lecciones.find(x => x.id === id);
  if (!l) return;
  l.aplicada = !l.aplicada;
  guardarLecciones();
  refrescarTodo();
}

/* Llena el <select> de proyectos usado en el formulario y en los filtros */
function renderSelectProyectos() {
  const selects = [document.getElementById('f-proyecto'), document.getElementById('filtroProyecto')];
  selects.forEach((select, idx) => {
    const valorActual = select.value;
    const placeholder = idx === 0 ? '<option value="">Selecciona un proyecto</option>' : '<option value="">Todos los proyectos</option>';
    select.innerHTML = placeholder + proyectos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    select.value = valorActual;
  });
}

/* ============================================================
   CONSULTAR LECCIONES
   ============================================================ */

function configurarConsulta() {
  ['buscador', 'filtroCategoria', 'filtroProyecto', 'filtroTipo', 'filtroImpacto'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderConsulta);
    document.getElementById(id).addEventListener('change', renderConsulta);
  });
}

function renderConsulta() {
  const texto = document.getElementById('buscador').value.toLowerCase();
  const categoria = document.getElementById('filtroCategoria').value;
  const proyecto = document.getElementById('filtroProyecto').value;
  const tipo = document.getElementById('filtroTipo').value;
  const impacto = document.getElementById('filtroImpacto').value;

  const filtradas = lecciones.filter(l => {
    if (categoria && l.categoria !== categoria) return false;
    if (proyecto && l.proyecto !== proyecto) return false;
    if (tipo && l.tipo !== tipo) return false;
    if (impacto && l.impacto !== impacto) return false;
    if (texto) {
      const bolsa = [l.descripcion, l.causa, l.solucion, l.recomendacion, l.buenasPracticas,
        nombreProyecto(l.proyecto), l.categoria, l.responsable].join(' ').toLowerCase();
      if (!bolsa.includes(texto)) return false;
    }
    return true;
  }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  const grid = document.getElementById('leccionesGrid');
  const empty = document.getElementById('leccionesEmpty');

  if (filtradas.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  grid.innerHTML = filtradas.map(l => `
    <div class="lesson-card">
      <div class="lesson-top">
        <div>
          <div class="lesson-project">${nombreProyecto(l.proyecto)}</div>
          <div class="lesson-category">${l.categoria}</div>
        </div>
        <span class="tag ${claseImpacto(l.impacto)}">${l.impacto}</span>
      </div>
      <div>
        <span class="tag ${l.tipo === 'Problema' ? 'tag-tipo-problema' : 'tag-tipo-practica'}">${l.tipo}</span>
      </div>
      <div class="lesson-text"><strong>Descripción:</strong> ${recortar(l.descripcion, 100)}</div>
      ${l.solucion ? `<div class="lesson-text"><strong>Solución:</strong> ${recortar(l.solucion, 90)}</div>` : ''}
      <div class="lesson-meta">
        <span>${l.responsable}</span>
        <span>${l.fecha}</span>
      </div>
      <div class="lesson-actions">
        <button class="btn btn-outline btn-sm" onclick="verDetalleLeccion('${l.id}')">Ver detalles</button>
        <button class="btn btn-ghost btn-sm" onclick="editarLeccion('${l.id}')">Editar</button>
        <button class="btn btn-danger-outline btn-sm" onclick="eliminarLeccion('${l.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function recortar(texto, max) {
  if (!texto) return '';
  return texto.length > max ? texto.slice(0, max) + '…' : texto;
}

/* ============================================================
   MODAL DE DETALLE DE LECCIÓN
   ============================================================ */

function configurarModales() {
  document.getElementById('modalClose').addEventListener('click', cerrarModal);
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') cerrarModal();
  });

  document.getElementById('modalProyectoClose').addEventListener('click', cerrarModalProyecto);
  document.getElementById('modalProyectoOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalProyectoOverlay') cerrarModalProyecto();
  });
}

function verDetalleLeccion(id) {
  const l = lecciones.find(x => x.id === id);
  if (!l) return;

  document.getElementById('modalBody').innerHTML = `
    <h3>${nombreProyecto(l.proyecto)}</h3>
    <p class="modal-sub">${l.categoria} · <span class="tag ${claseImpacto(l.impacto)}">${l.impacto}</span></p>

    <div class="modal-field"><label>Tipo de experiencia</label><p>${l.tipo}</p></div>
    <div class="modal-field"><label>Descripción</label><p>${l.descripcion}</p></div>
    ${l.causa ? `<div class="modal-field"><label>Causa identificada</label><p>${l.causa}</p></div>` : ''}
    ${l.solucion ? `<div class="modal-field"><label>Solución aplicada</label><p>${l.solucion}</p></div>` : ''}
    ${l.buenasPracticas ? `<div class="modal-field"><label>Buenas prácticas</label><p>${l.buenasPracticas}</p></div>` : ''}
    ${l.recomendacion ? `<div class="modal-field"><label>Recomendación</label><p>${l.recomendacion}</p></div>` : ''}
    <div class="modal-field"><label>Responsable</label><p>${l.responsable}</p></div>
    <div class="modal-field"><label>Fecha</label><p>${l.fecha}</p></div>
    <div class="modal-field">
      <label>¿Lección aplicada en la práctica?</label>
      <button class="btn ${l.aplicada ? 'btn-primary' : 'btn-outline'} btn-sm" onclick="alternarAplicada('${l.id}'); verDetalleLeccion('${l.id}')">
        ${l.aplicada ? '✓ Aplicada' : 'Marcar como aplicada'}
      </button>
    </div>
  `;
  document.getElementById('modalOverlay').hidden = false;
}

function cerrarModal() {
  document.getElementById('modalOverlay').hidden = true;
}

/* ============================================================
   PROYECTOS
   ============================================================ */

function configurarProyectos() {
  const form = document.getElementById('formProyecto');

  document.getElementById('btnNuevoProyecto').addEventListener('click', () => {
    form.hidden = !form.hidden;
  });

  document.getElementById('btnCancelarProyecto').addEventListener('click', () => {
    form.reset();
    form.hidden = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    guardarProyectoDesdeFormulario();
  });
}

function guardarProyectoDesdeFormulario() {
  const nombre = document.getElementById('p-nombre').value.trim();
  const descripcion = document.getElementById('p-descripcion').value.trim();
  const responsable = document.getElementById('p-responsable').value.trim();
  const estado = document.getElementById('p-estado').value;
  const fechaInicio = document.getElementById('p-inicio').value;
  const fechaFin = document.getElementById('p-fin').value;
  const msg = document.getElementById('proyectoMsg');

  if (!nombre || !responsable || !estado || !fechaInicio) {
    msg.textContent = 'Completa los campos obligatorios (*).';
    msg.className = 'form-msg error';
    return;
  }

  proyectos.push({ id: generarId(), nombre, descripcion, responsable, fechaInicio, fechaFin, estado });
  guardarProyectos();

  document.getElementById('formProyecto').reset();
  document.getElementById('formProyecto').hidden = true;
  msg.textContent = '';
  refrescarTodo();
}

function renderProyectos() {
  const grid = document.getElementById('proyectosGrid');

  if (proyectos.length === 0) {
    grid.innerHTML = '<p class="empty-state">Aún no hay proyectos registrados.</p>';
    return;
  }

  grid.innerHTML = proyectos.map(p => {
    const cantidadLecciones = lecciones.filter(l => l.proyecto === p.id).length;
    return `
    <div class="project-card" onclick="verDetalleProyecto('${p.id}')">
      <div class="lesson-top">
        <div class="project-name">${p.nombre}</div>
        <span class="status-pill ${claseEstado(p.estado)}">${p.estado}</span>
      </div>
      <div class="project-desc">${recortar(p.descripcion || 'Sin descripción.', 110)}</div>
      <div class="project-meta">
        <span>${p.responsable}</span>
        <span>${cantidadLecciones} lección(es)</span>
      </div>
    </div>
  `;
  }).join('');
}

function verDetalleProyecto(id) {
  const p = proyectos.find(x => x.id === id);
  if (!p) return;
  proyectoSeleccionadoId = id;

  const asociadas = lecciones.filter(l => l.proyecto === id);

  document.getElementById('modalProyectoBody').innerHTML = `
    <h3>${p.nombre}</h3>
    <p class="modal-sub"><span class="status-pill ${claseEstado(p.estado)}">${p.estado}</span></p>

    <div class="modal-field"><label>Descripción</label><p>${p.descripcion || 'Sin descripción.'}</p></div>
    <div class="modal-field"><label>Responsable</label><p>${p.responsable}</p></div>
    <div class="modal-field"><label>Fechas</label><p>${p.fechaInicio} ${p.fechaFin ? '→ ' + p.fechaFin : '(en curso)'}</p></div>

    <div class="modal-field">
      <label>Lecciones asociadas (${asociadas.length})</label>
      ${asociadas.length === 0 ? '<p>No hay lecciones registradas para este proyecto todavía.</p>' :
        asociadas.map(l => `
          <div class="suggestion-item">
            <span class="tag ${claseImpacto(l.impacto)}">${l.impacto}</span>
            &nbsp;<b>${l.categoria}</b> — ${recortar(l.descripcion, 90)}
          </div>
        `).join('')}
    </div>

    <div class="form-actions" style="margin-top:18px;">
      <button class="btn btn-danger-outline btn-sm" onclick="eliminarProyecto('${p.id}')">Eliminar proyecto</button>
    </div>
  `;
  document.getElementById('modalProyectoOverlay').hidden = false;
}

function eliminarProyecto(id) {
  const tieneLecciones = lecciones.some(l => l.proyecto === id);
  if (tieneLecciones && !confirm('Este proyecto tiene lecciones asociadas. Si lo eliminas, esas lecciones quedarán sin proyecto asignado. ¿Deseas continuar?')) {
    return;
  }
  proyectos = proyectos.filter(p => p.id !== id);
  guardarProyectos();
  cerrarModalProyecto();
  refrescarTodo();
}

function cerrarModalProyecto() {
  document.getElementById('modalProyectoOverlay').hidden = true;
}

/* ============================================================
   REPORTES
   ============================================================ */

function renderReportes() {
  pintarBarras('repCategorias', contarPorCampo('categoria'));
  pintarBarras('repProyectos', contarLeccionesPorProyecto());
  pintarBarras('repImpacto', contarPorCampo('impacto'));
  pintarRecurrentes('repRecurrentes', detectarProblemasRecurrentes());

  const buenasPracticas = lecciones.filter(l => l.tipo === 'Buena práctica').length;
  const aplicadas = lecciones.filter(l => l.aplicada).length;

  document.getElementById('repResumen').innerHTML = `
    <li>Total de lecciones <b>${lecciones.length}</b></li>
    <li>Problemas registrados <b>${lecciones.filter(l => l.tipo === 'Problema').length}</b></li>
    <li>Buenas prácticas registradas <b>${buenasPracticas}</b></li>
    <li>Lecciones aplicadas <b>${aplicadas}</b></li>
    <li>Proyectos registrados <b>${proyectos.length}</b></li>
  `;
}