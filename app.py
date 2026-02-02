from flask import Flask, render_template, request, jsonify, send_file
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import calendar
import io
import os
import json
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
import xlsxwriter

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default-secret-key-change-in-production')

# Inicializar Firebase
def init_firebase():
    """Inicializar Firebase con credenciales desde .env o key.json"""
    if not firebase_admin._apps:
        # Intentar cargar desde variables de entorno
        firebase_config = {
            'type': os.getenv('FIREBASE_TYPE'),
            'project_id': os.getenv('FIREBASE_PROJECT_ID'),
            'private_key_id': os.getenv('FIREBASE_PRIVATE_KEY_ID'),
            'private_key': os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
            'client_email': os.getenv('FIREBASE_CLIENT_EMAIL'),
            'client_id': os.getenv('FIREBASE_CLIENT_ID'),
            'auth_uri': os.getenv('FIREBASE_AUTH_URI'),
            'token_uri': os.getenv('FIREBASE_TOKEN_URI'),
            'auth_provider_x509_cert_url': os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
            'client_x509_cert_url': os.getenv('FIREBASE_CLIENT_X509_CERT_URL')
        }
        
        # Si todas las variables de entorno están configuradas, usar esas
        if all(firebase_config.values()):
            cred = credentials.Certificate(firebase_config)
            firebase_admin.initialize_app(cred)
            print("✓ Firebase inicializado desde variables de entorno")
        # Si no, intentar usar key.json (para desarrollo local)
        elif os.path.exists('key.json'):
            cred = credentials.Certificate('key.json')
            firebase_admin.initialize_app(cred)
            print("✓ Firebase inicializado desde key.json")
        else:
            raise Exception("No se encontraron credenciales de Firebase. Configura las variables de entorno o crea key.json")

init_firebase()
db = firestore.client()

# Nombre de los meses en español
MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

ESTADOS = [
    'Publicador',
    'Precursor Auxiliar',
    'Precursor Auxiliar Indefinido',
    'Precursor Regular'
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/grupos')
def get_grupos():
    """Obtener los 6 grupos"""
    grupos = [{'id': i, 'nombre': f'Grupo {i}'} for i in range(1, 7)]
    return jsonify(grupos)

@app.route('/api/publishers/all')
def get_all_publishers():
    """Obtener todos los publishers"""
    try:
        personas_ref = db.collection('Publishers')
        query = personas_ref.stream()
        
        personas = []
        for doc in query:
            persona_data = doc.to_dict()
            persona_data['id'] = doc.id
            personas.append(persona_data)
        
        return jsonify(personas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/publishers', methods=['POST'])
def create_publisher():
    """Crear un nuevo publisher"""
    try:
        data = request.json
        
        # Validar datos requeridos
        if 'name' not in data or not data['name']:
            return jsonify({'error': 'El nombre es requerido'}), 400
        
        new_publisher = {
            'name': data['name'],
            'groupID': data.get('groupID', 1),
            'state': data.get('state', 'Publicador'),
            'hours': data.get('hours', [])
        }
        
        # Agregar a Firestore
        doc_ref = db.collection('Publishers').add(new_publisher)
        
        return jsonify({
            'success': True, 
            'message': 'Publisher creado correctamente',
            'id': doc_ref[1].id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/publishers/<publisher_id>', methods=['DELETE'])
def delete_publisher(publisher_id):
    """Eliminar un publisher"""
    try:
        db.collection('Publishers').document(publisher_id).delete()
        return jsonify({'success': True, 'message': 'Publisher eliminado correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/personas/<int:grupo_id>')
def get_personas(grupo_id):
    """Obtener personas de un grupo específico"""
    try:
        personas_ref = db.collection('Publishers')
        query = personas_ref.where('groupID', '==', grupo_id).stream()
        
        personas = []
        for doc in query:
            persona_data = doc.to_dict()
            persona_data['id'] = doc.id
            personas.append(persona_data)
        
        return jsonify(personas)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/persona/<persona_id>', methods=['PUT'])
def update_persona(persona_id):
    """Actualizar información de una persona"""
    try:
        data = request.json
        persona_ref = db.collection('Publishers').document(persona_id)
        
        # Obtener datos actuales
        persona_doc = persona_ref.get()
        if not persona_doc.exists:
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        persona_data = persona_doc.to_dict()
        
        # Actualizar state si se proporciona
        if 'state' in data:
            persona_data['state'] = data['state']
        
        # Actualizar hours si se proporciona
        if 'hours' in data:
            hours_array = persona_data.get('hours', [])
            new_hour = data['hours']
            
            # Buscar si ya existe un registro para este mes/año
            found = False
            for i, hour_entry in enumerate(hours_array):
                if hour_entry.get('month') == new_hour['month'] and hour_entry.get('year') == new_hour['year']:
                    hours_array[i] = new_hour
                    found = True
                    break
            
            if not found:
                hours_array.append(new_hour)
            
            persona_data['hours'] = hours_array
        
        # Guardar cambios
        persona_ref.set(persona_data)
        
        return jsonify({'success': True, 'message': 'Persona actualizada correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/persona/admin/<persona_id>', methods=['PUT'])
def update_persona_admin(persona_id):
    """Actualizar información completa de una persona desde administración"""
    try:
        data = request.json
        persona_ref = db.collection('Publishers').document(persona_id)
        
        # Obtener datos actuales
        persona_doc = persona_ref.get()
        if not persona_doc.exists:
            return jsonify({'error': 'Persona no encontrada'}), 404
        
        persona_data = persona_doc.to_dict()
        
        # Actualizar los campos proporcionados
        if 'name' in data:
            persona_data['name'] = data['name']
        
        if 'groupID' in data:
            persona_data['groupID'] = data['groupID']
        
        if 'state' in data:
            persona_data['state'] = data['state']
        
        # Guardar cambios
        persona_ref.set(persona_data)
        
        return jsonify({'success': True, 'message': 'Persona actualizada correctamente'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reporte/<int:grupo_id>/<int:mes>/<int:year>')
def get_reporte_data(grupo_id, mes, year):
    """Obtener datos para el reporte"""
    try:
        personas_ref = db.collection('Publishers')
        query = personas_ref.where('groupID', '==', grupo_id).stream()
        
        # Agrupar por estado
        reporte = {
            'Publicador': [],
            'Precursor Auxiliar': [],
            'Precursor Auxiliar Indefinido': [],
            'Precursor Regular': []
        }
        
        for doc in query:
            persona_data = doc.to_dict()
            state = persona_data.get('state', 'Publicador')
            nombre = persona_data.get('name', 'Sin nombre')
            
            # Buscar los datos del mes específico
            hours_mes = 0
            participo = False
            estudios = 0
            comentario = ''
            
            hours_array = persona_data.get('hours', [])
            for hour_entry in hours_array:
                if hour_entry.get('month') == mes and hour_entry.get('year') == year:
                    hours_mes = hour_entry.get('hours', 0)
                    participo = hour_entry.get('Participo', False)
                    estudios = hour_entry.get('estudios', 0)
                    comentario = hour_entry.get('Comentario', '')
                    break
            
            if state in reporte:
                reporte[state].append({
                    'nombre': nombre,
                    'horas': hours_mes,
                    'participo': participo,
                    'estudios': estudios,
                    'comentario': comentario
                })
        
        # Calcular totales (solo horas para no Publicadores)
        totales = {}
        totales_estudios = {}
        for estado, personas in reporte.items():
            if estado == 'Publicador':
                # Para publicadores, contar cuántos participaron
                totales[estado] = sum(1 for p in personas if p['participo'])
            else:
                # Para otros, sumar horas y estudios
                totales[estado] = sum(p['horas'] for p in personas)
                totales_estudios[estado] = sum(p['estudios'] for p in personas)
        
        # Total general solo de horas (sin publicadores)
        total_general = sum(totales[estado] for estado in totales if estado != 'Publicador')
        total_estudios_general = sum(totales_estudios.values())
        
        return jsonify({
            'reporte': reporte,
            'totales': totales,
            'totales_estudios': totales_estudios,
            'total_general': total_general,
            'total_estudios_general': total_estudios_general,
            'mes': MESES[mes - 1],
            'year': year,
            'grupo': grupo_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/pdf/<int:grupo_id>/<int:mes>/<int:year>')
def export_pdf(grupo_id, mes, year):
    """Exportar reporte a PDF"""
    try:
        # Obtener datos del reporte
        personas_ref = db.collection('Publishers')
        query = personas_ref.where('groupID', '==', grupo_id).stream()
        
        reporte = {
            'Publicador': [],
            'Precursor Auxiliar': [],
            'Precursor Auxiliar Indefinido': [],
            'Precursor Regular': []
        }
        
        for doc in query:
            persona_data = doc.to_dict()
            state = persona_data.get('state', 'Publicador')
            nombre = persona_data.get('name', 'Sin nombre')
            
            hours_mes = 0
            participo = False
            estudios = 0
            comentario = ''
            
            hours_array = persona_data.get('hours', [])
            for hour_entry in hours_array:
                if hour_entry.get('month') == mes and hour_entry.get('year') == year:
                    hours_mes = hour_entry.get('hours', 0)
                    participo = hour_entry.get('Participo', False)
                    estudios = hour_entry.get('estudios', 0)
                    comentario = hour_entry.get('Comentario', '')
                    break
            
            if state in reporte:
                reporte[state].append({
                    'nombre': nombre,
                    'horas': hours_mes,
                    'participo': participo,
                    'estudios': estudios,
                    'comentario': comentario
                })
        
        # Crear PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1e3a8a'),
            spaceAfter=30,
            alignment=1
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1e40af'),
            spaceAfter=20,
            alignment=1
        )
        
        # Título
        title = Paragraph(f"Informe del mes de {MESES[mes - 1]} {year}", title_style)
        elements.append(title)
        
        subtitle = Paragraph(f"Grupo {grupo_id}", subtitle_style)
        elements.append(subtitle)
        elements.append(Spacer(1, 20))
        
        total_general = 0
        total_estudios_general = 0
        
        # Crear tabla para cada estado
        for estado in ['Publicador', 'Precursor Auxiliar', 'Precursor Auxiliar Indefinido', 'Precursor Regular']:
            if reporte[estado]:
                # Título del estado
                estado_title = Paragraph(f"<b>{estado}</b>", styles['Heading3'])
                elements.append(estado_title)
                elements.append(Spacer(1, 10))
                
                # Datos de la tabla
                if estado == 'Publicador':
                    # Para publicadores: nombre y participó
                    data = [['Nombre', 'Participó']]
                    total_participo = 0
                    
                    for persona in reporte[estado]:
                        participo_text = 'Sí' if persona['participo'] else 'No'
                        data.append([persona['nombre'], participo_text])
                        if persona['participo']:
                            total_participo += 1
                    
                    data.append(['Total Participaron', str(total_participo)])
                    
                    # Crear tabla
                    table = Table(data, colWidths=[4*inch, 1.5*inch])
                else:
                    # Para otros: nombre, horas, estudios, comentario
                    data = [['Nombre', 'Horas', 'Estudios', 'Comentario']]
                    total_estado = 0
                    total_estudios_estado = 0
                    
                    for persona in reporte[estado]:
                        comentario_text = persona['comentario'][:30] + '...' if len(persona['comentario']) > 30 else persona['comentario']
                        data.append([
                            persona['nombre'], 
                            str(persona['horas']),
                            str(persona['estudios']),
                            comentario_text
                        ])
                        total_estado += persona['horas']
                        total_estudios_estado += persona['estudios']
                    
                    data.append(['Total', str(total_estado), str(total_estudios_estado), ''])
                    total_general += total_estado
                    total_estudios_general += total_estudios_estado
                    
                    # Crear tabla
                    table = Table(data, colWidths=[2.5*inch, 1*inch, 1*inch, 2*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
                    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#93c5fd')),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                elements.append(table)
                elements.append(Spacer(1, 20))
        
        # Total general
        elements.append(Spacer(1, 10))
        total_data = [
            ['Total General de Horas (sin Publicadores)', str(total_general)],
            ['Total General de Estudios', str(total_estudios_general)]
        ]
        total_table = Table(total_data, colWidths=[4*inch, 1.5*inch])
        total_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 14),
            ('PADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(total_table)
        
        # Construir PDF
        doc.build(elements)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'informe_grupo_{grupo_id}_{MESES[mes-1]}_{year}.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/export/excel/<int:grupo_id>/<int:mes>/<int:year>')
def export_excel(grupo_id, mes, year):
    """Exportar reporte a Excel"""
    try:
        # Obtener datos del reporte
        personas_ref = db.collection('Publishers')
        query = personas_ref.where('groupID', '==', grupo_id).stream()
        
        reporte = {
            'Publicador': [],
            'Precursor Auxiliar': [],
            'Precursor Auxiliar Indefinido': [],
            'Precursor Regular': []
        }
        
        for doc in query:
            persona_data = doc.to_dict()
            state = persona_data.get('state', 'Publicador')
            nombre = persona_data.get('name', 'Sin nombre')
            
            hours_mes = 0
            participo = False
            estudios = 0
            comentario = ''
            
            hours_array = persona_data.get('hours', [])
            for hour_entry in hours_array:
                if hour_entry.get('month') == mes and hour_entry.get('year') == year:
                    hours_mes = hour_entry.get('hours', 0)
                    participo = hour_entry.get('Participo', False)
                    estudios = hour_entry.get('estudios', 0)
                    comentario = hour_entry.get('Comentario', '')
                    break
            
            if state in reporte:
                reporte[state].append({
                    'nombre': nombre,
                    'horas': hours_mes,
                    'participo': participo,
                    'estudios': estudios,
                    'comentario': comentario
                })
        
        # Crear Excel
        buffer = io.BytesIO()
        workbook = xlsxwriter.Workbook(buffer)
        worksheet = workbook.add_worksheet('Informe')
        
        # Formatos
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 18,
            'align': 'center',
            'valign': 'vcenter',
            'fg_color': '#1e3a8a',
            'font_color': 'white'
        })
        
        subtitle_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'align': 'center',
            'fg_color': '#3b82f6',
            'font_color': 'white'
        })
        
        header_format = workbook.add_format({
            'bold': True,
            'font_size': 12,
            'align': 'center',
            'fg_color': '#1e3a8a',
            'font_color': 'white',
            'border': 1
        })
        
        cell_format = workbook.add_format({
            'align': 'center',
            'border': 1
        })
        
        total_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'fg_color': '#93c5fd',
            'border': 1
        })
        
        total_general_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'align': 'center',
            'fg_color': '#1e3a8a',
            'font_color': 'white',
            'border': 1
        })
        
        # Título
        worksheet.merge_range('A1:E1', f'Informe del mes de {MESES[mes - 1]} {year}', title_format)
        worksheet.merge_range('A2:E2', f'Grupo {grupo_id}', subtitle_format)
        
        row = 3
        total_general = 0
        total_estudios_general = 0
        
        # Escribir datos por estado
        for estado in ['Publicador', 'Precursor Auxiliar', 'Precursor Auxiliar Indefinido', 'Precursor Regular']:
            if reporte[estado]:
                # Título del estado
                if estado == 'Publicador':
                    worksheet.merge_range(row, 0, row, 1, estado, subtitle_format)
                    row += 1
                    
                    # Headers para Publicadores
                    worksheet.write(row, 0, 'Nombre', header_format)
                    worksheet.write(row, 1, 'Participó', header_format)
                    row += 1
                    
                    # Datos
                    total_participo = 0
                    for persona in reporte[estado]:
                        worksheet.write(row, 0, persona['nombre'], cell_format)
                        participo_text = 'Sí' if persona['participo'] else 'No'
                        worksheet.write(row, 1, participo_text, cell_format)
                        if persona['participo']:
                            total_participo += 1
                        row += 1
                    
                    # Total del estado
                    worksheet.write(row, 0, 'Total Participaron', total_format)
                    worksheet.write(row, 1, total_participo, total_format)
                    row += 2
                else:
                    worksheet.merge_range(row, 0, row, 4, estado, subtitle_format)
                    row += 1
                    
                    # Headers para otros estados
                    worksheet.write(row, 0, 'Nombre', header_format)
                    worksheet.write(row, 1, 'Horas', header_format)
                    worksheet.write(row, 2, 'Estudios', header_format)
                    worksheet.write(row, 3, 'Participó', header_format)
                    worksheet.write(row, 4, 'Comentario', header_format)
                    row += 1
                    
                    # Datos
                    total_estado = 0
                    total_estudios_estado = 0
                    for persona in reporte[estado]:
                        worksheet.write(row, 0, persona['nombre'], cell_format)
                        worksheet.write(row, 1, persona['horas'], cell_format)
                        worksheet.write(row, 2, persona['estudios'], cell_format)
                        participo_text = 'Sí' if persona['participo'] else 'No'
                        worksheet.write(row, 3, participo_text, cell_format)
                        worksheet.write(row, 4, persona['comentario'], cell_format)
                        total_estado += persona['horas']
                        total_estudios_estado += persona['estudios']
                        row += 1
                    
                    # Total del estado
                    worksheet.write(row, 0, 'Total', total_format)
                    worksheet.write(row, 1, total_estado, total_format)
                    worksheet.write(row, 2, total_estudios_estado, total_format)
                    worksheet.write(row, 3, '', total_format)
                    worksheet.write(row, 4, '', total_format)
                    total_general += total_estado
                    total_estudios_general += total_estudios_estado
                    row += 2
        
        # Total general
        worksheet.write(row, 0, 'Total General de Horas (sin Publicadores)', total_general_format)
        worksheet.write(row, 1, total_general, total_general_format)
        worksheet.write(row, 2, '', total_general_format)
        worksheet.write(row, 3, '', total_general_format)
        worksheet.write(row, 4, '', total_general_format)
        row += 1
        worksheet.write(row, 0, 'Total General de Estudios', total_general_format)
        worksheet.write(row, 1, total_estudios_general, total_general_format)
        worksheet.write(row, 2, '', total_general_format)
        worksheet.write(row, 3, '', total_general_format)
        worksheet.write(row, 4, '', total_general_format)
        
        # Ajustar columnas
        worksheet.set_column('A:A', 30)
        worksheet.set_column('B:B', 12)
        worksheet.set_column('C:C', 12)
        worksheet.set_column('D:D', 12)
        worksheet.set_column('E:E', 40)
        
        workbook.close()
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f'informe_grupo_{grupo_id}_{MESES[mes-1]}_{year}.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
