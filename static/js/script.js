// Variables globales
let grupoSeleccionado = null;
let mesSeleccionado = null;
let yearSeleccionado = new Date().getFullYear();
let personasData = [];
let modoAdmin = false;

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    // Establecer el mes actual por defecto
    const mesActual = new Date().getMonth() + 1;
    document.getElementById('mes-select').value = mesActual;
});

// Funciones del menú principal
function irAGrupos() {
    modoAdmin = false;
    cargarGrupos();
    cambiarSeccion('grupo-section');
}

function irAAdministracion() {
    modoAdmin = true;
    cargarTodosPublishersAdmin();
    cambiarSeccion('admin-grupo-section');
}

function volverMenu() {
    cambiarSeccion('menu-section');
    grupoSeleccionado = null;
    mesSeleccionado = null;
    personasData = [];
}

// Cargar todos los publishers para administración
async function cargarTodosPublishersAdmin() {
    try {
        showLoading(true);
        const response = await fetch('/api/publishers/all');
        let publishers = await response.json();
        
        // Ordenar por groupID
        publishers.sort((a, b) => (a.groupID || 0) - (b.groupID || 0));
        
        personasData = publishers;
        
        const personasContainer = document.getElementById('admin-all-personas-container');
        personasContainer.innerHTML = '';
        
        publishers.forEach((persona, index) => {
            const personaCard = crearAdminPersonaCardConEliminar(persona, index);
            personasContainer.appendChild(personaCard);
        });
        
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar publishers:', error);
        showToast('Error al cargar los publishers', false);
        showLoading(false);
    }
}

// Cargar grupos para administración (mantener para compatibilidad)
async function cargarGrupos() {
    try {
        showLoading(true);
        const response = await fetch('/api/grupos');
        const grupos = await response.json();
        
        const gruposGrid = document.getElementById('grupos-grid');
        gruposGrid.innerHTML = '';
        
        grupos.forEach((grupo, index) => {
            const grupoCard = document.createElement('div');
            grupoCard.className = 'grupo-card';
            grupoCard.style.animationDelay = `${index * 0.1}s`;
            grupoCard.innerHTML = `
                <i class="fas fa-users"></i>
                <h3>${grupo.nombre}</h3>
                <p>Click para ver el grupo</p>
            `;
            grupoCard.onclick = () => seleccionarGrupo(grupo.id);
            gruposGrid.appendChild(grupoCard);
        });
        
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar grupos:', error);
        showToast('Error al cargar los grupos', false);
        showLoading(false);
    }
}

// Cargar grupos para administración
async function cargarGruposAdmin() {
    try {
        showLoading(true);
        const response = await fetch('/api/grupos');
        const grupos = await response.json();
        
        const gruposGrid = document.getElementById('admin-grupos-grid');
        gruposGrid.innerHTML = '';
        
        grupos.forEach((grupo, index) => {
            const grupoCard = document.createElement('div');
            grupoCard.className = 'grupo-card';
            grupoCard.style.animationDelay = `${index * 0.1}s`;
            grupoCard.innerHTML = `
                <i class="fas fa-users-cog"></i>
                <h3>${grupo.nombre}</h3>
                <p>Click para administrar</p>
            `;
            grupoCard.onclick = () => seleccionarGrupoAdmin(grupo.id);
            gruposGrid.appendChild(grupoCard);
        });
        
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar grupos:', error);
        showToast('Error al cargar los grupos', false);
        showLoading(false);
    }
}

// Seleccionar grupo para administración
function seleccionarGrupoAdmin(grupoId) {
    grupoSeleccionado = grupoId;
    document.getElementById('admin-grupo-titulo').textContent = `Administración - Grupo ${grupoId}`;
    cargarPersonasAdmin(grupoId);
}

// Cargar personas para administración
async function cargarPersonasAdmin(grupoId) {
    try {
        showLoading(true);
        const response = await fetch(`/api/personas/${grupoId}`);
        personasData = await response.json();
        
        const personasContainer = document.getElementById('admin-personas-container');
        personasContainer.innerHTML = '';
        
        personasData.forEach((persona, index) => {
            const personaCard = crearAdminPersonaCard(persona, index);
            personasContainer.appendChild(personaCard);
        });
        
        cambiarSeccion('admin-personas-section');
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar personas:', error);
        showToast('Error al cargar las personas', false);
        showLoading(false);
    }
}

// Crear tarjeta de persona para administración
function crearAdminPersonaCard(persona, index) {
    const card = document.createElement('div');
    card.className = 'admin-persona-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.setAttribute('data-nombre', (persona.name || '').toLowerCase());
    
    const estados = [
        'Publicador',
        'Precursor Auxiliar',
        'Precursor Auxiliar Indefinido',
        'Precursor Regular'
    ];
    
    card.innerHTML = `
        <div class="admin-persona-header">
            <div class="admin-persona-icon">
                <i class="fas fa-user"></i>
            </div>
            <div class="admin-persona-info">
                <h4>${persona.name || 'Sin nombre'}</h4>
            </div>
        </div>
        <div class="admin-form-grid">
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-user"></i> Nombre
                </label>
                <input 
                    type="text" 
                    class="input-text" 
                    id="admin-name-${persona.id}" 
                    value="${persona.name || ''}" 
                    placeholder="Nombre completo"
                >
            </div>
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-layer-group"></i> Grupo ID
                </label>
                <select class="input-select-small" id="admin-groupid-${persona.id}">
                    ${[1, 2, 3, 4, 5, 6].map(num => 
                        `<option value="${num}" ${persona.groupID === num ? 'selected' : ''}>${num}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-user-tag"></i> Estado
                </label>
                <select class="input-select-small" id="admin-state-${persona.id}">
                    ${estados.map(estado => 
                        `<option value="${estado}" ${persona.state === estado ? 'selected' : ''}>${estado}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <button class="btn-save-admin" onclick="guardarPersonaAdmin('${persona.id}')">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
    `;
    
    return card;
}

// Crear tarjeta de persona para administración con opción de eliminar
function crearAdminPersonaCardConEliminar(persona, index) {
    const card = document.createElement('div');
    card.className = 'admin-persona-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.setAttribute('data-nombre', (persona.name || '').toLowerCase());
    
    const estados = [
        'Publicador',
        'Precursor Auxiliar',
        'Precursor Auxiliar Indefinido',
        'Precursor Regular'
    ];
    
    card.innerHTML = `
        <div class="admin-persona-header">
            <div class="admin-persona-icon">
                <i class="fas fa-user"></i>
            </div>
            <div class="admin-persona-info">
                <h4>${persona.name || 'Sin nombre'}</h4>
                <span class="grupo-badge">Grupo ${persona.groupID || '?'}</span>
            </div>
        </div>
        <div class="admin-form-grid">
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-user"></i> Nombre
                </label>
                <input 
                    type="text" 
                    class="input-text" 
                    id="admin-name-${persona.id}" 
                    value="${persona.name || ''}" 
                    placeholder="Nombre completo"
                >
            </div>
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-layer-group"></i> Grupo ID
                </label>
                <select class="input-select-small" id="admin-groupid-${persona.id}">
                    ${[1, 2, 3, 4, 5, 6].map(num => 
                        `<option value="${num}" ${persona.groupID === num ? 'selected' : ''}>${num}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="admin-field-group">
                <label>
                    <i class="fas fa-user-tag"></i> Estado
                </label>
                <select class="input-select-small" id="admin-state-${persona.id}">
                    ${estados.map(estado => 
                        `<option value="${estado}" ${persona.state === estado ? 'selected' : ''}>${estado}</option>`
                    ).join('')}
                </select>
            </div>
        </div>
        <button class="btn-save-admin" onclick="guardarPersonaAdmin('${persona.id}')">
            <i class="fas fa-save"></i> Guardar Cambios
        </button>
        <button class="btn-delete-admin" onclick="confirmarEliminarPublisher('${persona.id}', '${(persona.name || '').replace(/'/g, "\\'")}')">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    `;
    
    return card;
}

// Guardar cambios en administración
async function guardarPersonaAdmin(personaId) {
    const name = document.getElementById(`admin-name-${personaId}`).value.trim();
    const groupID = parseInt(document.getElementById(`admin-groupid-${personaId}`).value);
    const state = document.getElementById(`admin-state-${personaId}`).value;
    
    if (!name) {
        showToast('El nombre no puede estar vacío', false);
        return;
    }
    
    const data = {
        name: name,
        groupID: groupID,
        state: state
    };
    
    try {
        showLoading(true);
        const response = await fetch(`/api/persona/admin/${personaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Cambios guardados correctamente', true);
            
            // Actualizar datos locales
            const personaIndex = personasData.findIndex(p => p.id === personaId);
            if (personaIndex !== -1) {
                personasData[personaIndex].name = name;
                personasData[personaIndex].groupID = groupID;
                personasData[personaIndex].state = state;
            }
        } else {
            showToast('Error al guardar cambios', false);
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error al guardar persona:', error);
        showToast('Error al guardar cambios', false);
        showLoading(false);
    }
}

// Seleccionar grupo
function seleccionarGrupo(grupoId) {
    grupoSeleccionado = grupoId;
    document.getElementById('grupo-titulo').textContent = `Grupo ${grupoId}`;
    cambiarSeccion('mes-section');
}

// Cargar personas del grupo
async function cargarPersonas() {
    if (!grupoSeleccionado) return;
    
    mesSeleccionado = parseInt(document.getElementById('mes-select').value);
    
    try {
        showLoading(true);
        const response = await fetch(`/api/personas/${grupoSeleccionado}`);
        personasData = await response.json();
        
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        document.getElementById('personas-titulo').textContent = `Grupo ${grupoSeleccionado}`;
        document.getElementById('mes-seleccionado').textContent = `Informe de ${meses[mesSeleccionado - 1]} ${yearSeleccionado}`;
        
        const personasContainer = document.getElementById('personas-container');
        personasContainer.innerHTML = '';
        
        personasData.forEach((persona, index) => {
            const personaCard = crearPersonaCard(persona, index);
            personasContainer.appendChild(personaCard);
        });
        
        cambiarSeccion('personas-section');
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar personas:', error);
        showToast('Error al cargar las personas', false);
        showLoading(false);
    }
}

// Crear tarjeta de persona
function crearPersonaCard(persona, index) {
    const card = document.createElement('div');
    card.className = 'persona-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.setAttribute('data-nombre', (persona.name || '').toLowerCase());
    
    const state = persona.state || 'Publicador';
    const esPublicador = state === 'Publicador';
    
    // Buscar los datos del mes actual
    let horasActuales = 0;
    let participo = true;
    let estudiosActuales = 0;
    let comentarioActual = '';
    
    if (persona.hours) {
        const horasMes = persona.hours.find(h => 
            h.month === mesSeleccionado && h.year === yearSeleccionado
        );
        if (horasMes) {
            horasActuales = horasMes.hours || 0;
            participo = horasMes.Participo !== undefined ? horasMes.Participo : true;
            estudiosActuales = horasMes.estudios || 0;
            comentarioActual = horasMes.Comentario || '';
        }
    }
    
    const estados = [
        'Publicador',
        'Precursor Auxiliar',
        'Precursor Auxiliar Indefinido',
        'Precursor Regular'
    ];
    
    // Construir HTML según el tipo de estado
    let camposHTML = '';
    
    if (esPublicador) {
        // Para Publicadores: participó, estudios y comentario (sin horas)
        camposHTML = `
            <div class="field-group">
                <label>
                    <i class="fas fa-check-circle"></i> ¿Participó en la predicación?
                </label>
                <select class="input-select-small" id="participo-${persona.id}">
                    <option value="true" ${participo ? 'selected' : ''}>Sí</option>
                    <option value="false" ${!participo ? 'selected' : ''}>No</option>
                </select>
            </div>
            <div class="field-group">
                <label>
                    <i class="fas fa-book"></i> Estudios
                </label>
                <input 
                    type="number" 
                    class="input-number" 
                    id="estudios-${persona.id}" 
                    value="${estudiosActuales}" 
                    min="0"
                    placeholder="0"
                >
            </div>
            <div class="field-group field-full">
                <label>
                    <i class="fas fa-comment"></i> Comentario
                </label>
                <textarea 
                    class="input-textarea" 
                    id="comentario-${persona.id}" 
                    placeholder="Comentarios adicionales..."
                    rows="2"
                >${comentarioActual}</textarea>
            </div>
        `;
    } else {
        // Para otros estados: horas, participó (por defecto Sí), estudios, comentario
        camposHTML = `
            <div class="field-group">
                <label>
                    <i class="fas fa-clock"></i> Horas
                </label>
                <input 
                    type="number" 
                    class="input-number" 
                    id="hours-${persona.id}" 
                    value="${horasActuales}" 
                    min="0"
                    placeholder="0"
                >
            </div>
            <div class="field-group">
                <label>
                    <i class="fas fa-check-circle"></i> ¿Participó?
                </label>
                <select class="input-select-small" id="participo-${persona.id}">
                    <option value="true" ${participo ? 'selected' : ''}>Sí</option>
                    <option value="false" ${!participo ? 'selected' : ''}>No</option>
                </select>
            </div>
            <div class="field-group">
                <label>
                    <i class="fas fa-book"></i> Estudios
                </label>
                <input 
                    type="number" 
                    class="input-number" 
                    id="estudios-${persona.id}" 
                    value="${estudiosActuales}" 
                    min="0"
                    placeholder="0"
                >
            </div>
            <div class="field-group field-full">
                <label>
                    <i class="fas fa-comment"></i> Comentario
                </label>
                <textarea 
                    class="input-textarea" 
                    id="comentario-${persona.id}" 
                    placeholder="Comentarios adicionales..."
                    rows="2"
                >${comentarioActual}</textarea>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="persona-header">
            <div class="persona-icon">
                <i class="fas fa-user"></i>
            </div>
            <div class="persona-info">
                <h4>${persona.name || 'Sin nombre'}</h4>
                <span class="badge">${state}</span>
            </div>
        </div>
        <div class="persona-fields">
            ${camposHTML}
            <div class="field-group">
                <label>
                    <i class="fas fa-user-tag"></i> Estado
                </label>
                <select class="input-select-small" id="state-${persona.id}" onchange="actualizarCamposPersona('${persona.id}')">
                    ${estados.map(estado => 
                        `<option value="${estado}" ${state === estado ? 'selected' : ''}>${estado}</option>`
                    ).join('')}
                </select>
            </div>
            <button class="btn-save" onclick="guardarPersona('${persona.id}')">
                <i class="fas fa-save"></i> Guardar Cambios
            </button>
        </div>
    `;
    
    return card;
}

// Guardar cambios de persona
async function guardarPersona(personaId) {
    const persona = personasData.find(p => p.id === personaId);
    const state = document.getElementById(`state-${personaId}`).value;
    const esPublicador = state === 'Publicador';
    
    let hoursData = {
        month: mesSeleccionado,
        year: yearSeleccionado,
        Participo: document.getElementById(`participo-${personaId}`).value === 'true',
        estudios: parseInt(document.getElementById(`estudios-${personaId}`).value) || 0,
        Comentario: document.getElementById(`comentario-${personaId}`).value.trim()
    };
    
    if (!esPublicador) {
        // Para no publicadores: incluir horas
        hoursData.hours = parseInt(document.getElementById(`hours-${personaId}`).value) || 0;
    } else {
        // Para publicadores: hours = 0
        hoursData.hours = 0;
    }
    
    const data = {
        hours: hoursData,
        state: state
    };
    
    try {
        showLoading(true);
        const response = await fetch(`/api/persona/${personaId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Cambios guardados correctamente', true);
            
            // Actualizar datos locales
            const personaIndex = personasData.findIndex(p => p.id === personaId);
            if (personaIndex !== -1) {
                personasData[personaIndex].state = state;
                if (!personasData[personaIndex].hours) {
                    personasData[personaIndex].hours = [];
                }
                const horasIndex = personasData[personaIndex].hours.findIndex(h => 
                    h.month === mesSeleccionado && h.year === yearSeleccionado
                );
                if (horasIndex !== -1) {
                    personasData[personaIndex].hours[horasIndex] = hoursData;
                } else {
                    personasData[personaIndex].hours.push(hoursData);
                }
            }
        } else {
            showToast('Error al guardar cambios', false);
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error al guardar persona:', error);
        showToast('Error al guardar cambios', false);
        showLoading(false);
    }
}

// Actualizar campos cuando cambia el estado
function actualizarCamposPersona(personaId) {
    const personaIndex = personasData.findIndex(p => p.id === personaId);
    if (personaIndex === -1) return;
    
    // Obtener el nuevo estado del select
    const nuevoEstado = document.getElementById(`state-${personaId}`).value;
    
    // Actualizar el estado en los datos locales
    personasData[personaIndex].state = nuevoEstado;
    
    // Obtener el contenedor y las tarjetas
    const container = document.getElementById('personas-container');
    const cards = container.querySelectorAll('.persona-card');
    const cardIndex = Array.from(cards).findIndex(card => card.querySelector(`#state-${personaId}`));
    
    if (cardIndex !== -1) {
        // Recrear la tarjeta con el nuevo estado
        const newCard = crearPersonaCard(personasData[personaIndex], cardIndex);
        cards[cardIndex].replaceWith(newCard);
    }
}

// Exportar a Excel
async function exportarExcel() {
    if (!grupoSeleccionado || !mesSeleccionado) return;
    
    try {
        showLoading(true);
        window.location.href = `/api/export/excel/${grupoSeleccionado}/${mesSeleccionado}/${yearSeleccionado}`;
        showLoading(false);
        showToast('Exportando a Excel...', true);
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        showToast('Error al exportar a Excel', false);
        showLoading(false);
    }
}

// Exportar a PDF
async function exportarPDF() {
    if (!grupoSeleccionado || !mesSeleccionado) return;
    
    try {
        showLoading(true);
        window.location.href = `/api/export/pdf/${grupoSeleccionado}/${mesSeleccionado}/${yearSeleccionado}`;
        showLoading(false);
        showToast('Exportando a PDF...', true);
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        showToast('Error al exportar a PDF', false);
        showLoading(false);
    }
}

// Funciones de navegación
function cambiarSeccion(seccionId) {
    const secciones = document.querySelectorAll('.section');
    secciones.forEach(seccion => {
        seccion.classList.remove('active');
    });
    
    document.getElementById(seccionId).classList.add('active');
}

function volverGrupos() {
    cambiarSeccion('grupo-section');
    grupoSeleccionado = null;
}

function volverMes() {
    cambiarSeccion('mes-section');
    mesSeleccionado = null;
    personasData = [];
}

function volverAdminGrupos() {
    cambiarSeccion('admin-grupo-section');
    grupoSeleccionado = null;
    personasData = [];
}

// Funciones de filtrado
function filtrarPersonas() {
    const searchTerm = document.getElementById('personas-search').value.toLowerCase();
    const cards = document.querySelectorAll('#personas-container .persona-card');
    
    cards.forEach(card => {
        const nombre = card.getAttribute('data-nombre');
        if (nombre.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function filtrarPersonasAdmin() {
    const searchTerm = document.getElementById('admin-search').value.toLowerCase();
    const cards = document.querySelectorAll('#admin-personas-container .admin-persona-card');
    
    cards.forEach(card => {
        const nombre = card.getAttribute('data-nombre');
        if (nombre.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Modal y funciones de crear nuevo publisher
function mostrarFormularioNuevo() {
    document.getElementById('nuevo-name').value = '';
    document.getElementById('nuevo-groupid').value = '1';
    document.getElementById('nuevo-state').value = 'Publicador';
    document.getElementById('modal-nuevo').classList.add('active');
}

function cerrarModalNuevo() {
    document.getElementById('modal-nuevo').classList.remove('active');
}

async function crearNuevoPublisher() {
    const name = document.getElementById('nuevo-name').value.trim();
    const groupID = parseInt(document.getElementById('nuevo-groupid').value);
    const state = document.getElementById('nuevo-state').value;
    
    if (!name) {
        showToast('El nombre es requerido', false);
        return;
    }
    
    const data = {
        name: name,
        groupID: groupID,
        state: state,
        hours: []
    };
    
    try {
        showLoading(true);
        const response = await fetch('/api/publishers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Publisher creado correctamente', true);
            cerrarModalNuevo();
            cargarTodosPublishersAdmin();
        } else {
            showToast('Error al crear publisher', false);
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error al crear publisher:', error);
        showToast('Error al crear publisher', false);
        showLoading(false);
    }
}

// Confirmar y eliminar publisher
function confirmarEliminarPublisher(publisherId, publisherName) {
    // Mostrar modal de confirmación
    document.getElementById('confirm-message').textContent = `¿Deseas eliminar a "${publisherName}"? Esta acción no se puede deshacer.`;
    document.getElementById('modal-confirmar').classList.add('active');
    
    // Configurar el botón de confirmación
    const btnConfirm = document.getElementById('btn-confirm-action');
    btnConfirm.onclick = function() {
        cerrarModalConfirmar();
        eliminarPublisher(publisherId);
    };
}

function cerrarModalConfirmar() {
    document.getElementById('modal-confirmar').classList.remove('active');
}

async function eliminarPublisher(publisherId) {
    try {
        showLoading(true);
        const response = await fetch(`/api/publishers/${publisherId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Publisher eliminado correctamente', true);
            cargarTodosPublishersAdmin();
        } else {
            showToast('Error al eliminar publisher', false);
        }
        
        showLoading(false);
    } catch (error) {
        console.error('Error al eliminar publisher:', error);
        showToast('Error al eliminar publisher', false);
        showLoading(false);
    }
}

// Filtrar publishers en administración
function filtrarPublishersAdmin() {
    const searchTerm = document.getElementById('admin-search-all').value.toLowerCase();
    const cards = document.querySelectorAll('#admin-all-personas-container .admin-persona-card');
    
    cards.forEach(card => {
        const nombre = card.getAttribute('data-nombre');
        if (nombre.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Funciones de UI
function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('active');
    } else {
        loading.classList.remove('active');
    }
}

function showToast(message, success = true) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const icon = toast.querySelector('i');
    
    toastMessage.textContent = message;
    
    if (success) {
        toast.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        icon.className = 'fas fa-check-circle';
    } else {
        toast.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        icon.className = 'fas fa-exclamation-circle';
    }
    
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
