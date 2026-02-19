from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import json
import secrets
from datetime import datetime, timedelta
import requests  # Necesario para obtener tasas de cambio actualizadas

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
CORS(app)

# ============= CONFIGURACIÓN DE MONEDAS =============

# Tasas de cambio aproximadas (estáticas como respaldo)
TASAS_CAMBIO_ESTATICAS = {
    'COP': 1,  # Peso Colombiano (moneda base)
    'USD': 4100,  # 1 USD = 4100 COP
    'EUR': 4500,  # 1 EUR = 4500 COP
    'MXN': 240,   # 1 MXN = 240 COP
    'ARS': 4.8,   # 1 ARS = 4.8 COP
    'CLP': 4.5,   # 1 CLP = 4.5 COP
    'PEN': 1100,  # 1 PEN = 1100 COP
    'BRL': 820    # 1 BRL = 820 COP
}

# Símbolos de monedas
SIMBOLOS_MONEDA = {
    'COP': '$',
    'USD': 'US$',
    'EUR': '€',
    'MXN': 'MX$',
    'ARS': 'AR$',
    'CLP': 'CL$',
    'PEN': 'S/',
    'BRL': 'R$'
}

# Nombres completos de monedas
NOMBRES_MONEDA = {
    'COP': 'Peso Colombiano',
    'USD': 'Dólar Americano',
    'EUR': 'Euro',
    'MXN': 'Peso Mexicano',
    'ARS': 'Peso Argentino',
    'CLP': 'Peso Chileno',
    'PEN': 'Sol Peruano',
    'BRL': 'Real Brasileño'
}

def obtener_tasas_actualizadas():
    """
    Intenta obtener tasas de cambio actualizadas de una API gratuita
    """
    try:
        # Usamos una API gratuita (exchangerate-api.com)
        response = requests.get('https://api.exchangerate-api.com/v4/latest/COP', timeout=3)
        if response.status_code == 200:
            data = response.json()
            rates = data.get('rates', {})
            
            # Mapear las monedas que nos interesan
            tasas = {
                'COP': 1,
                'USD': rates.get('USD', TASAS_CAMBIO_ESTATICAS['USD']),
                'EUR': rates.get('EUR', TASAS_CAMBIO_ESTATICAS['EUR']),
                'MXN': rates.get('MXN', TASAS_CAMBIO_ESTATICAS['MXN']),
                'ARS': rates.get('ARS', TASAS_CAMBIO_ESTATICAS['ARS']),
                'CLP': rates.get('CLP', TASAS_CAMBIO_ESTATICAS['CLP']),
                'PEN': rates.get('PEN', TASAS_CAMBIO_ESTATICAS['PEN']),
                'BRL': rates.get('BRL', TASAS_CAMBIO_ESTATICAS['BRL'])
            }
            return tasas
    except:
        # Si falla, usar tasas estáticas
        pass
    
    return TASAS_CAMBIO_ESTATICAS

# Tasas de cambio (se actualizarán cada vez que se inicie la app)
TASAS_CAMBIO = obtener_tasas_actualizadas()

def convertir_moneda(monto, desde, hasta, tasas=None):
    """
    Convierte un monto de una moneda a otra
    """
    if tasas is None:
        tasas = TASAS_CAMBIO
    
    if desde == hasta:
        return monto
    
    # Convertir a COP primero (moneda base)
    if desde != 'COP':
        monto_en_cop = monto * tasas[desde]
    else:
        monto_en_cop = monto
    
    # Convertir de COP a moneda destino
    if hasta != 'COP':
        monto_destino = monto_en_cop / tasas[hasta]
    else:
        monto_destino = monto_en_cop
    
    return round(monto_destino, 2)

def formatear_moneda(monto, moneda='COP', incluir_simbolo=True):
    """
    Formatea un monto según la moneda seleccionada
    """
    simbolo = SIMBOLOS_MONEDA.get(moneda, '$')
    if incluir_simbolo:
        return f"{simbolo} {monto:,.0f}".replace(',', '.')
    else:
        return f"{monto:,.0f}".replace(',', '.')

# ============= FUNCIONES DE ANÁLISIS FINANCIERO =============

def analizar_regla_503020(ingresos, gastos, moneda='COP'):
    """
    Analiza los gastos según la regla 50/30/20
    """
    total_gastos = sum(gasto['monto'] for gasto in gastos)
    
    # Clasificar gastos
    necesidades = sum(gasto['monto'] for gasto in gastos if gasto['categoria'] == 'necesidad')
    deseos = sum(gasto['monto'] for gasto in gastos if gasto['categoria'] == 'deseo')
    ahorro_inversion = sum(gasto['monto'] for gasto in gastos if gasto['categoria'] == 'ahorro')
    
    # Calcular porcentajes
    porcentaje_necesidades = (necesidades / ingresos) * 100
    porcentaje_deseos = (deseos / ingresos) * 100
    porcentaje_ahorro = (ahorro_inversion / ingresos) * 100
    
    # Análisis y recomendaciones
    diagnosticos = []
    
    if porcentaje_necesidades > 55:
        diagnosticos.append({
            'tipo': 'peligro',
            'mensaje': f'Tus necesidades son el {porcentaje_necesidades:.1f}% de tus ingresos. Superan el 50% recomendado.',
            'consejo': 'Revisa gastos fijos como renta, servicios o suscripciones. Podrías negociar tarifas o buscar alternativas más económicas.'
        })
    elif porcentaje_necesidades > 50:
        diagnosticos.append({
            'tipo': 'advertencia',
            'mensaje': f'Tus necesidades son el {porcentaje_necesidades:.1f}%. Estás ligeramente arriba del 50%.',
            'consejo': 'Mantén un ojo en estos gastos. Pequeños ajustes en servicios pueden marcar la diferencia.'
        })
    else:
        diagnosticos.append({
            'tipo': 'exito',
            'mensaje': f'Excelente! Tus necesidades son solo el {porcentaje_necesidades:.1f}% de tus ingresos.',
            'consejo': 'Estás manejando bien tus gastos esenciales. Puedes destinar el excedente al ahorro o deseos.'
        })
    
    if porcentaje_deseos > 35:
        diagnosticos.append({
            'tipo': 'peligro',
            'mensaje': f'Tus deseos representan el {porcentaje_deseos:.1f}% de tus ingresos, superando el 30% recomendado.',
            'consejo': 'Identifica 2-3 suscripciones que puedas cancelar o reduce salidas a comer.'
        })
    elif porcentaje_deseos > 30:
        diagnosticos.append({
            'tipo': 'advertencia',
            'mensaje': f'Tus deseos son el {porcentaje_deseos:.1f}%. Estás en el límite del 30%.',
            'consejo': 'Evalúa qué deseos realmente te hacen feliz. Un presupuesto semanal para gustos puede ayudar.'
        })
    else:
        diagnosticos.append({
            'tipo': 'exito',
            'mensaje': f'Bien! Tus deseos son solo el {porcentaje_deseos:.1f}% de tus ingresos.',
            'consejo': 'Disfrutas sin descuidar tus finanzas. Sigue así!'
        })
    
    if porcentaje_ahorro < 15:
        diagnosticos.append({
            'tipo': 'peligro',
            'mensaje': f'Estás ahorrando solo el {porcentaje_ahorro:.1f}%, muy por debajo del 20% recomendado.',
            'consejo': 'Recuerda la regla: "Págate a ti primero". Programa una transferencia automática el día que recibes tu ingreso.'
        })
    elif porcentaje_ahorro < 20:
        diagnosticos.append({
            'tipo': 'advertencia',
            'mensaje': f'Ahorras el {porcentaje_ahorro:.1f}%, cerca del 20% ideal.',
            'consejo': 'Busca aumentar gradualmente tu ahorro. Cada pequeño incremento suma gracias al interés compuesto.'
        })
    else:
        diagnosticos.append({
            'tipo': 'exito',
            'mensaje': f'¡Excelente! Ahorras el {porcentaje_ahorro:.1f}%, superando la meta del 20%.',
            'consejo': 'Considera diversificar tus inversiones. El hábito del ahorro te llevará lejos.'
        })
    
    # Calcular ahorro disponible para metas
    ahorro_disponible_mensual = ingresos * 0.2 - ahorro_inversion
    if ahorro_disponible_mensual < 0:
        ahorro_disponible_mensual = 0
    
    return {
        'ingresos': ingresos,
        'moneda': moneda,
        'simbolo_moneda': SIMBOLOS_MONEDA.get(moneda, '$'),
        'totales': {
            'necesidades': necesidades,
            'deseos': deseos,
            'ahorro': ahorro_inversion
        },
        'porcentajes': {
            'necesidades': round(porcentaje_necesidades, 1),
            'deseos': round(porcentaje_deseos, 1),
            'ahorro': round(porcentaje_ahorro, 1)
        },
        'diagnosticos': diagnosticos,
        'ahorro_disponible': round(ahorro_disponible_mensual, 2)
    }

def calcular_proyeccion_meta(monto_objetivo, ahorro_actual, ahorro_mensual=0, plazo_deseado=None, moneda='COP'):
    """
    Calcula el tiempo necesario para alcanzar una meta de ahorro
    """
    # Validaciones
    if monto_objetivo <= 0:
        return {'error': 'El monto objetivo debe ser mayor a 0'}
    
    # Si ya alcanzó la meta
    if ahorro_actual >= monto_objetivo:
        return {
            'meta_alcanzada': True,
            'mensaje': '¡Ya alcanzaste tu meta!',
            'excedente': ahorro_actual - monto_objetivo,
            'ahorro_actual': ahorro_actual,
            'monto_objetivo': monto_objetivo,
            'moneda': moneda,
            'simbolo_moneda': SIMBOLOS_MONEDA.get(moneda, '$')
        }
    
    # Calcular cuánto falta por ahorrar
    falta_por_ahorrar = monto_objetivo - ahorro_actual
    
    # Caso 1: Calcular ahorro mensual necesario basado en plazo deseado
    if plazo_deseado and plazo_deseado > 0:
        ahorro_necesario = falta_por_ahorrar / plazo_deseado
        
        fecha_estimada = datetime.now() + timedelta(days=30 * plazo_deseado)
        
        return {
            'tipo_calculo': 'por_plazo',
            'meses_plazo': plazo_deseado,
            'ahorro_mensual_necesario': round(ahorro_necesario, 2),
            'falta_por_ahorrar': round(falta_por_ahorrar, 2),
            'fecha_estimada': fecha_estimada.strftime('%d/%m/%Y'),
            'fecha_estimada_larga': fecha_estimada.strftime('%d de %B de %Y'),
            'es_posible': ahorro_necesario > 0,
            'moneda': moneda,
            'simbolo_moneda': SIMBOLOS_MONEDA.get(moneda, '$')
        }
    
    # Caso 2: Calcular tiempo necesario basado en ahorro mensual
    elif ahorro_mensual and ahorro_mensual > 0:
        meses_para_meta = falta_por_ahorrar / ahorro_mensual
        
        if meses_para_meta <= 0:
            return {'error': 'El cálculo no es válido. Revisa los montos ingresados.'}
        
        fecha_estimada = datetime.now() + timedelta(days=30 * meses_para_meta)
        
        return {
            'tipo_calculo': 'por_ahorro',
            'meses_para_meta': round(meses_para_meta, 1),
            'años_para_meta': round(meses_para_meta / 12, 1),
            'fecha_estimada': fecha_estimada.strftime('%d/%m/%Y'),
            'fecha_estimada_larga': fecha_estimada.strftime('%d de %B de %Y'),
            'ahorro_mensual': ahorro_mensual,
            'falta_por_ahorrar': round(falta_por_ahorrar, 2),
            'moneda': moneda,
            'simbolo_moneda': SIMBOLOS_MONEDA.get(moneda, '$')
        }
    
    else:
        return {'error': 'Debes proporcionar un ahorro mensual o un plazo deseado'}

# ============= RECOMENDACIONES FINANCIERAS =============

def obtener_recomendaciones():
    """
    Base de conocimiento financiero con mejores prácticas
    """
    return {
        'tecnicas_ahorro': [
            {
                'titulo': 'Regla del Ahorro Automático',
                'descripcion': 'Programa una transferencia automática a tu cuenta de ahorros el mismo día que recibes tu ingreso. "Lo que no ves, no lo gastas".',
                'beneficio': 'Ahorras sin fuerza de voluntad, creando el hábito inconscientemente.'
            },
            {
                'titulo': 'Método de los 365 Días',
                'descripcion': 'Ahorra $1 el día 1, $2 el día 2, y así sucesivamente. Al final del año tendrás $66,795.',
                'beneficio': 'Comienza pequeño y aumenta gradualmente, haciendo el ahorro manejable.'
            },
            {
                'titulo': 'Desafío de las 52 Semanas',
                'descripcion': 'Ahorra $100 la semana 1, $200 la semana 2, etc. O al revés: empieza con $5,200 la semana 1 y disminuye.',
                'beneficio': 'Flexibilidad para adaptarse a tu flujo de efectivo semanal.'
            }
        ],
        'tecnicas_salir_deudas': [
            {
                'titulo': 'Método Bola de Nieve (Snowball)',
                'descripcion': 'Lista tus deudas de menor a mayor monto. Paga el mínimo en todas y destina todo extra a la más pequeña. Al liquidarla, usa ese pago para la siguiente.',
                'beneficio': 'Ganas motivación al ver resultados rápidos, manteniendo el impulso psicológico.'
            },
            {
                'titulo': 'Método Avalancha (Avalanche)',
                'descripcion': 'Prioriza las deudas con la tasa de interés más alta primero, independientemente del monto.',
                'beneficio': 'Matemáticamente es el más eficiente: pagas menos intereses totales.'
            },
            {
                'titulo': 'Consolidación de Deudas',
                'descripcion': 'Unifica múltiples deudas en un solo préstamo con menor tasa de interés.',
                'beneficio': 'Simplifica pagos y reduce el costo financiero total.'
            }
        ],
        'libertad_financiera': [
            {
                'titulo': 'FIRE (Financial Independence, Retire Early)',
                'descripcion': 'Ahorra agresivamente (50-70% de ingresos) para alcanzar la independencia financiera antes de la edad de retiro tradicional.',
                'subtipo': 'Coast FIRE',
                'detalle': 'Acumula suficiente para que tus inversiones crezcan hasta el retiro sin más aportes, permitiéndote trabajar en algo que amas sin presión financiera.'
            },
            {
                'titulo': 'Regla del 4%',
                'descripcion': 'Necesitas un capital 25 veces tus gastos anuales. Puedes retirar el 4% anual ajustado por inflación sin agotar tu capital.',
                'ejemplo': 'Si gastas $300,000 al año, necesitas $7,500,000 invertidos.'
            },
            {
                'titulo': 'Efecto del Interés Compuesto',
                'descripcion': 'Tu mejor aliado es el tiempo. Invertir $5,000 mensuales desde los 25 años vs desde los 35 años puede significar el DOBLE de capital al retiro.',
                'dato': 'A los 65 años, el que empezó a los 25 tendría ~$10M vs ~$5M del que empezó a los 35 (asumiendo 8% anual).'
            }
        ],
        'tips_adicionales': [
            {
                'categoria': 'Mentalidad',
                'consejo': 'Concéntrate en las "preguntas de 30,000 dólares", no en las de 3. Enfócate en tu tasa de ahorro, retorno de inversiones y desarrollo profesional, no en el café diario.'
            },
            {
                'categoria': 'Ingresos',
                'consejo': 'Busca apalancamiento: crea activos que generen ingresos sin tu tiempo (cursos online, apps, contenido digital).'
            },
            {
                'categoria': 'Fondo de Emergencia',
                'consejo': 'Construye un fondo de 6-24 meses de gastos en activos líquidos antes de invertir agresivamente. Te protege de vender en mercado bajista.'
            }
        ]
    }

# ============= RUTAS DE LA APLICACIÓN =============

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analisis')
def analisis():
    return render_template('analisis.html')

@app.route('/metas')
def metas():
    return render_template('metas.html')

@app.route('/recomendaciones')
def recomendaciones():
    return render_template('recomendaciones.html', data=obtener_recomendaciones())

# API Endpoints

@app.route('/api/analizar', methods=['POST'])
def api_analizar():
    data = request.json
    ingresos = data.get('ingresos', 0)
    gastos = data.get('gastos', [])
    moneda = data.get('moneda', 'COP')
    
    resultado = analizar_regla_503020(ingresos, gastos, moneda)
    return jsonify(resultado)

@app.route('/api/proyectar-meta', methods=['POST'])
def api_proyectar_meta():
    data = request.json
    monto_objetivo = data.get('monto_objetivo', 0)
    ahorro_actual = data.get('ahorro_actual', 0)
    ahorro_mensual = data.get('ahorro_mensual', 0)
    plazo_deseado = data.get('plazo_deseado')
    moneda = data.get('moneda', 'COP')
    
    # Convertir a número si existe
    if ahorro_mensual is not None:
        ahorro_mensual = float(ahorro_mensual)
    if plazo_deseado:
        try:
            plazo_deseado = int(plazo_deseado)
        except:
            plazo_deseado = None
    
    resultado = calcular_proyeccion_meta(
        monto_objetivo=monto_objetivo,
        ahorro_actual=ahorro_actual,
        ahorro_mensual=ahorro_mensual,
        plazo_deseado=plazo_deseado,
        moneda=moneda
    )
    return jsonify(resultado)

@app.route('/api/recomendaciones', methods=['GET'])
def api_recomendaciones():
    return jsonify(obtener_recomendaciones())

@app.route('/api/convertir-moneda', methods=['POST'])
def api_convertir_moneda():
    """
    Endpoint para convertir montos entre diferentes monedas
    """
    data = request.json
    monto = data.get('monto', 0)
    desde = data.get('desde', 'COP')
    hasta = data.get('hasta', 'USD')
    
    resultado = convertir_moneda(monto, desde, hasta)
    
    return jsonify({
        'monto_original': monto,
        'moneda_origen': desde,
        'moneda_destino': hasta,
        'monto_convertido': resultado,
        'tasa_usada': TASAS_CAMBIO.get(desde, 1) / TASAS_CAMBIO.get(hasta, 1) if desde != hasta else 1
    })

@app.route('/api/monedas', methods=['GET'])
def api_monedas():
    """
    Devuelve la lista de monedas soportadas
    """
    monedas = []
    for codigo in SIMBOLOS_MONEDA.keys():
        monedas.append({
            'codigo': codigo,
            'nombre': NOMBRES_MONEDA.get(codigo, codigo),
            'simbolo': SIMBOLOS_MONEDA.get(codigo, '$'),
            'tasa_cop': TASAS_CAMBIO.get(codigo, 1)
        })
    
    return jsonify({
        'monedas': monedas,
        'fecha_actualizacion': datetime.now().strftime('%d/%m/%Y %H:%M'),
        'tasas_actualizadas': True
    })

if __name__ == '__main__':
    app.run(debug=True)