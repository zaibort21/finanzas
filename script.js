// ============= FUNCIONES UTILITARIAS =============

// Formatear números como moneda
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(valor);
}

// Formatear porcentajes
function formatearPorcentaje(valor) {
    return new Intl.NumberFormat('es-MX', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(valor / 100);
}

// Mostrar notificaciones temporales
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion notificacion-${tipo}`;
    notificacion.textContent = mensaje;
    
    document.body.appendChild(notificacion);
    
    // Mostrar con animación
    setTimeout(() => {
        notificacion.classList.add('mostrar');
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notificacion.classList.remove('mostrar');
        setTimeout(() => {
            document.body.removeChild(notificacion);
        }, 300);
    }, 3000);
}

// Validar email
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Guardar en localStorage
function guardarEnLocalStorage(clave, valor) {
    try {
        localStorage.setItem(clave, JSON.stringify(valor));
        return true;
    } catch (e) {
        console.error('Error guardando en localStorage:', e);
        return false;
    }
}

// Leer de localStorage
function leerDeLocalStorage(clave) {
    try {
        const valor = localStorage.getItem(clave);
        return valor ? JSON.parse(valor) : null;
    } catch (e) {
        console.error('Error leyendo de localStorage:', e);
        return null;
    }
}

// ============= ANIMACIONES Y EFECTOS =============

// Smooth scroll para enlaces internos
document.querySelectorAll('a[href^="#"]').forEach(enlace => {
    enlace.addEventListener('click', function(e) {
        e.preventDefault();
        const destino = document.querySelector(this.getAttribute('href'));
        if (destino) {
            destino.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animación de entrada para elementos con clase 'fade-in'
const observarElementos = new IntersectionObserver((entradas) => {
    entradas.forEach(entrada => {
        if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.fade-in').forEach(elemento => {
    observarElementos.observe(elemento);
});

// ============= MANEJO DE FORMULARIOS =============

// Prevenir envío de formularios vacíos
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar campos requeridos
        const requeridos = this.querySelectorAll('[required]');
        let valido = true;
        
        requeridos.forEach(campo => {
            if (!campo.value.trim()) {
                campo.classList.add('error');
                valido = false;
                
                // Quitar clase error después de 3 segundos
                setTimeout(() => {
                    campo.classList.remove('error');
                }, 3000);
            }
        });
        
        if (valido) {
            // Disparar evento personalizado para formularios válidos
            this.dispatchEvent(new CustomEvent('formulario-valido'));
        } else {
            mostrarNotificacion('Por favor completa todos los campos requeridos', 'error');
        }
    });
});

// ============= FUNCIONES PARA LA CALCULADORA DE INTERÉS COMPUESTO =============

function calcularInteresCompuesto() {
    const inicial = parseFloat(document.getElementById('inversion-inicial')?.value) || 0;
    const mensual = parseFloat(document.getElementById('aporte-mensual')?.value) || 0;
    const tasa = parseFloat(document.getElementById('tasa-interes')?.value) || 0;
    const años = parseFloat(document.getElementById('anos-inversion')?.value) || 0;
    
    if (años <= 0) {
        mostrarNotificacion('Ingresa un número de años válido', 'advertencia');
        return;
    }
    
    const tasaMensual = tasa / 100 / 12;
    const meses = años * 12;
    
    // Fórmula de interés compuesto con aportes mensuales
    let total = inicial;
    for (let i = 0; i < meses; i++) {
        total = total * (1 + tasaMensual) + mensual;
    }
    
    const totalInvertido = inicial + (mensual * meses);
    const ganancias = total - totalInvertido;
    
    const resultadoDiv = document.getElementById('resultado-interes');
    if (resultadoDiv) {
        resultadoDiv.innerHTML = `
            <div class="resultado-item">
                <p>Total después de ${años} años:</p>
                <p class="valor-principal">${formatearMoneda(total)}</p>
            </div>
            <div class="resultado-item">
                <p>Total invertido:</p>
                <p>${formatearMoneda(totalInvertido)}</p>
            </div>
            <div class="resultado-item">
                <p>Ganancias por interés compuesto:</p>
                <p class="valor-ganancia">${formatearMoneda(ganancias)}</p>
            </div>
            <div class="resultado-item">
                <p>Rendimiento:</p>
                <p class="valor-ganancia">${((ganancias / totalInvertido) * 100).toFixed(1)}%</p>
            </div>
        `;
        
        // Guardar último cálculo
        guardarEnLocalStorage('ultimoCalculoInteres', {
            inicial,
            mensual,
            tasa,
            años,
            total,
            ganancias
        });
    }
}

// ============= FUNCIONES PARA METAS DE AHORRO =============

function calcularMetaAhorro() {
    const montoObjetivo = parseFloat(document.getElementById('monto-objetivo')?.value) || 0;
    const ahorroActual = parseFloat(document.getElementById('ahorro-actual')?.value) || 0;
    const ahorroMensual = parseFloat(document.getElementById('ahorro-mensual')?.value) || 0;
    const plazoDeseado = document.getElementById('plazo-deseado')?.value;
    
    if (montoObjetivo <= 0) {
        mostrarNotificacion('Por favor ingresa un monto objetivo válido', 'error');
        return;
    }

    if (ahorroMensual <= 0 && !plazoDeseado) {
        mostrarNotificacion('Ingresa un ahorro mensual o un plazo deseado', 'advertencia');
        return;
    }

    const data = {
        monto_objetivo: montoObjetivo,
        ahorro_actual: ahorroActual,
        ahorro_mensual: ahorroMensual,
        plazo_deseado: plazoDeseado || null
    };

    // Mostrar loading
    const btnCalcular = document.getElementById('calcular-meta');
    const textoOriginal = btnCalcular.textContent;
    btnCalcular.textContent = 'Calculando...';
    btnCalcular.disabled = true;

    fetch('/api/proyectar-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        mostrarProyeccionMeta(data);
        // Guardar meta en historial
        guardarMetaEnHistorial(montoObjetivo, ahorroActual, data);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al calcular la proyección', 'error');
    })
    .finally(() => {
        btnCalcular.textContent = textoOriginal;
        btnCalcular.disabled = false;
    });
}

function mostrarProyeccionMeta(data) {
    const resultadoDiv = document.getElementById('resultado-meta');
    const contenidoDiv = document.getElementById('proyeccion-contenido');
    
    if (!resultadoDiv || !contenidoDiv) return;
    
    resultadoDiv.style.display = 'block';
    
    if (data.error) {
        contenidoDiv.innerHTML = `<p class="error">${data.error}</p>`;
        return;
    }

    let html = '';
    
    if (data.tipo_calculo === 'por_plazo') {
        html = `
            <div class="proyeccion-card">
                <p class="proyeccion-label">💰 Ahorro mensual necesario:</p>
                <p class="proyeccion-valor">${formatearMoneda(data.ahorro_mensual_necesario)}</p>
                <p class="proyeccion-detalle">Para alcanzar tu meta en ${data.meses_para_meta} meses</p>
            </div>
            <div class="proyeccion-card">
                <p class="proyeccion-label">📅 Fecha estimada de logro:</p>
                <p class="proyeccion-valor">${data.fecha_estimada}</p>
            </div>
            ${data.ahorro_mensual_necesario > 0 ? `
                <div class="proyeccion-card ${data.ahorro_mensual_necesario > 5000 ? 'advertencia' : 'exito'}">
                    <p class="proyeccion-label">📊 Análisis:</p>
                    <p>${data.ahorro_mensual_necesario > 5000 ? 
                        'El ahorro requerido es alto. Considera extender el plazo o reducir la meta.' : 
                        '¡El ahorro requerido es alcanzable! Sigue adelante.'}</p>
                </div>
            ` : ''}
        `;
    } else {
        html = `
            <div class="proyeccion-card">
                <p class="proyeccion-label">⏱️ Tiempo necesario:</p>
                <p class="proyeccion-valor">${data.meses_para_meta} meses</p>
                <p class="proyeccion-detalle">(${data.años_para_meta} años)</p>
            </div>
            <div class="proyeccion-card">
                <p class="proyeccion-label">📅 Fecha estimada de logro:</p>
                <p class="proyeccion-valor">${data.fecha_estimada}</p>
            </div>
            <div class="proyeccion-card">
                <p class="proyeccion-label">💪 Progreso mensual:</p>
                <div class="progreso-barra">
                    <div class="progreso-lleno" style="width: ${Math.min(100, (ahorroMensual / (montoObjetivo/12)) * 100)}%"></div>
                </div>
                <p class="proyeccion-detalle">Estás ahorrando el ${((ahorroMensual * 12 / montoObjetivo) * 100).toFixed(1)}% de tu meta anual</p>
            </div>
        `;
    }
    
    contenidoDiv.innerHTML = html;
    resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function guardarMetaEnHistorial(monto, actual, resultado) {
    const historial = leerDeLocalStorage('historialMetas') || [];
    
    historial.push({
        fecha: new Date().toLocaleDateString(),
        montoObjetivo: monto,
        ahorroActual: actual,
        resultado: resultado,
        nombre: document.getElementById('meta-nombre')?.value || 'Meta sin nombre'
    });
    
    // Mantener solo últimas 10 metas
    if (historial.length > 10) {
        historial.shift();
    }
    
    guardarEnLocalStorage('historialMetas', historial);
}

// ============= FUNCIONES PARA ANÁLISIS 50/30/20 =============

function agregarGasto(descripcion = '', monto = 0, categoria = 'necesidad') {
    const container = document.getElementById('gastos-container');
    if (!container) return;
    
    const gastoDiv = document.createElement('div');
    gastoDiv.className = 'gasto-item fade-in';
    gastoDiv.innerHTML = `
        <input type="text" placeholder="Descripción" class="gasto-descripcion" value="${descripcion}">
        <input type="number" placeholder="Monto" class="gasto-monto" min="0" step="100" value="${monto}">
        <select class="gasto-categoria">
            <option value="necesidad" ${categoria === 'necesidad' ? 'selected' : ''}>Necesidad</option>
            <option value="deseo" ${categoria === 'deseo' ? 'selected' : ''}>Deseo</option>
            <option value="ahorro" ${categoria === 'ahorro' ? 'selected' : ''}>Ahorro/Inversión</option>
        </select>
        <button class="btn-eliminar" onclick="eliminarGasto(this)" title="Eliminar gasto">🗑️</button>
    `;
    
    container.appendChild(gastoDiv);
    
    // Animar entrada
    setTimeout(() => {
        gastoDiv.classList.add('visible');
    }, 10);
    
    return gastoDiv;
}

function eliminarGasto(boton) {
    const gastoDiv = boton.closest('.gasto-item');
    gastoDiv.classList.remove('visible');
    
    setTimeout(() => {
        gastoDiv.remove();
        actualizarTotalGastos();
    }, 300);
}

function actualizarTotalGastos() {
    const gastos = document.querySelectorAll('.gasto-item');
    const total = Array.from(gastos).reduce((sum, gasto) => {
        const monto = parseFloat(gasto.querySelector('.gasto-monto')?.value) || 0;
        return sum + monto;
    }, 0);
    
    const totalElement = document.getElementById('total-gastos');
    if (totalElement) {
        totalElement.textContent = formatearMoneda(total);
    }
}

function analizarFinanzas() {
    const ingresos = parseFloat(document.getElementById('ingresos')?.value) || 0;
    
    if (ingresos <= 0) {
        mostrarNotificacion('Por favor ingresa tus ingresos mensuales', 'error');
        return;
    }
    
    const gastos = [];
    document.querySelectorAll('.gasto-item').forEach(item => {
        const descripcion = item.querySelector('.gasto-descripcion')?.value || 'Gasto';
        const monto = parseFloat(item.querySelector('.gasto-monto')?.value) || 0;
        const categoria = item.querySelector('.gasto-categoria')?.value || 'necesidad';
        
        if (monto > 0) {
            gastos.push({ descripcion, monto, categoria });
        }
    });

    if (gastos.length === 0) {
        mostrarNotificacion('Agrega al menos un gasto para analizar', 'advertencia');
        return;
    }

    // Mostrar loading
    const btnAnalizar = document.getElementById('analizar-btn');
    const textoOriginal = btnAnalizar.textContent;
    btnAnalizar.textContent = 'Analizando...';
    btnAnalizar.disabled = true;

    fetch('/api/analizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingresos, gastos })
    })
    .then(response => response.json())
    .then(data => {
        mostrarResultadosAnalisis(data);
        guardarAnalisisEnHistorial(ingresos, gastos, data);
    })
    .catch(error => {
        console.error('Error:', error);
        mostrarNotificacion('Error al analizar las finanzas', 'error');
    })
    .finally(() => {
        btnAnalizar.textContent = textoOriginal;
        btnAnalizar.disabled = false;
    });
}

function mostrarResultadosAnalisis(data) {
    const resultadosDiv = document.getElementById('resultados');
    if (!resultadosDiv) return;
    
    resultadosDiv.style.display = 'block';
    
    // Actualizar resumen
    document.getElementById('resumen-ingresos').textContent = formatearMoneda(data.ingresos);
    
    // Actualizar barras con animación
    setTimeout(() => {
        document.getElementById('barra-necesidades').style.width = data.porcentajes.necesidades + '%';
        document.getElementById('porc-necesidades').textContent = data.porcentajes.necesidades + '%';
        
        document.getElementById('barra-deseos').style.width = data.porcentajes.deseos + '%';
        document.getElementById('porc-deseos').textContent = data.porcentajes.deseos + '%';
        
        document.getElementById('barra-ahorro').style.width = data.porcentajes.ahorro + '%';
        document.getElementById('porc-ahorro').textContent = data.porcentajes.ahorro + '%';
    }, 100);
    
    // Mostrar diagnósticos
    const diagnosticosDiv = document.getElementById('diagnosticos-container');
    diagnosticosDiv.innerHTML = '<h3>🔍 Diagnóstico Personalizado</h3>';
    
    data.diagnosticos.forEach(diag => {
        const diagElement = document.createElement('div');
        diagElement.className = `diagnostico diagnostico-${diag.tipo} fade-in`;
        diagElement.innerHTML = `
            <p class="diagnostico-mensaje">${diag.mensaje}</p>
            <p class="diagnostico-consejo">💡 ${diag.consejo}</p>
        `;
        diagnosticosDiv.appendChild(diagElement);
        
        setTimeout(() => {
            diagElement.classList.add('visible');
        }, 50);
    });
    
    // Mostrar ahorro disponible
    const ahorroDiv = document.getElementById('ahorro-disponible-container');
    ahorroDiv.innerHTML = `
        <h3>💰 Ahorro Disponible para Metas</h3>
        <p class="ahorro-monto">${formatearMoneda(data.ahorro_disponible)} mensuales</p>
        <p class="ahorro-texto">Este es el dinero que podrías destinar a nuevas metas de ahorro según la regla 50/30/20.</p>
        <a href="/metas" class="btn-small">🎯 Planificar Meta →</a>
    `;
    
    resultadosDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function guardarAnalisisEnHistorial(ingresos, gastos, resultado) {
    const historial = leerDeLocalStorage('historialAnalisis') || [];
    
    historial.push({
        fecha: new Date().toLocaleDateString(),
        ingresos: ingresos,
        totalGastos: gastos.reduce((sum, g) => sum + g.monto, 0),
        resultado: resultado
    });
    
    // Mantener solo últimas 10 análisis
    if (historial.length > 10) {
        historial.shift();
    }
    
    guardarEnLocalStorage('historialAnalisis', historial);
}

// ============= FUNCIONES PARA RECOMENDACIONES =============

function cargarRecomendaciones() {
    fetch('/api/recomendaciones')
        .then(response => response.json())
        .then(data => {
            console.log('Recomendaciones cargadas:', data);
            // Las recomendaciones ya se renderizan desde el servidor
            // Este fetch es útil para actualizaciones dinámicas
        })
        .catch(error => console.error('Error cargando recomendaciones:', error));
}

function filtrarRecomendaciones(categoria) {
    const cards = document.querySelectorAll('.recomendacion-card');
    
    cards.forEach(card => {
        if (categoria === 'todos' || card.dataset.categoria === categoria) {
            card.style.display = 'block';
            setTimeout(() => {
                card.classList.add('visible');
            }, 10);
        } else {
            card.classList.remove('visible');
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// ============= FUNCIONES PARA ESTADÍSTICAS Y GRÁFICAS =============

function calcularEstadisticas() {
    const historialAnalisis = leerDeLocalStorage('historialAnalisis') || [];
    
    if (historialAnalisis.length === 0) return null;
    
    const ultimo = historialAnalisis[historialAnalisis.length - 1];
    const primer = historialAnalisis[0];
    
    return {
        totalAnalisis: historialAnalisis.length,
        promedioAhorro: historialAnalisis.reduce((sum, a) => sum + (a.resultado?.porcentajes?.ahorro || 0), 0) / historialAnalisis.length,
        mejora: ultimo && primer ? (ultimo.resultado?.porcentajes?.ahorro || 0) - (primer.resultado?.porcentajes?.ahorro || 0) : 0,
        mejorAhorro: Math.max(...historialAnalisis.map(a => a.resultado?.porcentajes?.ahorro || 0))
    };
}

function mostrarEstadisticas() {
    const stats = calcularEstadisticas();
    if (!stats) return;
    
    const statsDiv = document.getElementById('estadisticas-container');
    if (!statsDiv) return;
    
    statsDiv.innerHTML = `
        <h3>📊 Tu Progreso</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <span class="stat-valor">${stats.totalAnalisis}</span>
                <span class="stat-etiqueta">Análisis realizados</span>
            </div>
            <div class="stat-item">
                <span class="stat-valor">${stats.promedioAhorro.toFixed(1)}%</span>
                <span class="stat-etiqueta">Ahorro promedio</span>
            </div>
            <div class="stat-item ${stats.mejora >= 0 ? 'positivo' : 'negativo'}">
                <span class="stat-valor">${stats.mejora >= 0 ? '+' : ''}${stats.mejora.toFixed(1)}%</span>
                <span class="stat-etiqueta">Mejora total</span>
            </div>
            <div class="stat-item">
                <span class="stat-valor">${stats.mejorAhorro.toFixed(1)}%</span>
                <span class="stat-etiqueta">Mejor registro</span>
            </div>
        </div>
    `;
}

// ============= INICIALIZACIÓN =============

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 FinanzasPro iniciado');
    
    // Inicializar componentes según la página actual
    const path = window.location.pathname;
    
    if (path.includes('analisis')) {
        // Inicializar página de análisis
        const btnAgregar = document.getElementById('agregar-gasto');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', () => agregarGasto());
            
            // Agregar algunos gastos de ejemplo
            setTimeout(() => {
                agregarGasto('Renta', 15000, 'necesidad');
                agregarGasto('Supermercado', 4000, 'necesidad');
                agregarGasto('Salidas', 3000, 'deseo');
            }, 100);
        }
        
        const btnAnalizar = document.getElementById('analizar-btn');
        if (btnAnalizar) {
            btnAnalizar.addEventListener('click', analizarFinanzas);
        }
        
        // Cargar análisis previo si existe
        const ultimoAnalisis = leerDeLocalStorage('ultimoAnalisis');
        if (ultimoAnalisis && confirm('¿Quieres cargar tu último análisis?')) {
            document.getElementById('ingresos').value = ultimoAnalisis.ingresos;
            // Aquí iría la lógica para cargar los gastos
        }
    }
    
    if (path.includes('metas')) {
        // Inicializar página de metas
        const btnCalcular = document.getElementById('calcular-meta');
        if (btnCalcular) {
            btnCalcular.addEventListener('click', calcularMetaAhorro);
        }
        
        // Cargar ejemplo
        setTimeout(() => {
            if (!document.getElementById('monto-objetivo').value) {
                document.getElementById('meta-nombre').value = 'Fondo de Emergencia';
                document.getElementById('monto-objetivo').value = '100000';
                document.getElementById('ahorro-actual').value = '15000';
                document.getElementById('ahorro-mensual').value = '5000';
            }
        }, 100);
        
        // Mostrar historial de metas
        mostrarEstadisticas();
    }
    
    if (path.includes('recomendaciones')) {
        // Inicializar página de recomendaciones
        const btnCalcularInteres = document.getElementById('calcular-interes');
        if (btnCalcularInteres) {
            btnCalcularInteres.addEventListener('click', calcularInteresCompuesto);
            
            // Cargar último cálculo
            const ultimoCalculo = leerDeLocalStorage('ultimoCalculoInteres');
            if (ultimoCalculo) {
                document.getElementById('inversion-inicial').value = ultimoCalculo.inicial;
                document.getElementById('aporte-mensual').value = ultimoCalculo.mensual;
                document.getElementById('tasa-interes').value = ultimoCalculo.tasa;
                document.getElementById('anos-inversion').value = ultimoCalculo.años;
                calcularInteresCompuesto();
            }
        }
        
        // Botones de filtro si existen
        document.querySelectorAll('[data-filtro]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoria = e.target.dataset.filtro;
                filtrarRecomendaciones(categoria);
            });
        });
    }
    
    // Inicializar tooltips
    document.querySelectorAll('[data-tooltip]').forEach(elemento => {
        elemento.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = rect.top - tooltip.offsetHeight - 5 + 'px';
            tooltip.style.left = rect.left + (rect.width - tooltip.offsetWidth) / 2 + 'px';
            
            e.target.addEventListener('mouseleave', () => {
                document.body.removeChild(tooltip);
            }, { once: true });
        });
    });
    
    // Detectar cambios en línea para actualizar totales
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('gasto-monto')) {
            actualizarTotalGastos();
        }
    });
});

// ============= EXPORTAR FUNCIONES PARA USO GLOBAL =============

// Hacer funciones disponibles globalmente
window.agregarGasto = agregarGasto;
window.eliminarGasto = eliminarGasto;
window.analizarFinanzas = analizarFinanzas;
window.calcularMetaAhorro = calcularMetaAhorro;
window.calcularInteresCompuesto = calcularInteresCompuesto;
window.formatearMoneda = formatearMoneda;
window.mostrarNotificacion = mostrarNotificacion;