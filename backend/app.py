from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_generator import generate_resume
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('flask_app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

app = Flask(__name__)

# Настройка CORS - разрешаем все источники для отладки
CORS(app, supports_credentials=True)

# Конфигурация
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['ALLOWED_EXTENSIONS'] = {'pdf', 'docx', 'txt'}
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB

# Дополнительные CORS заголовки для всех ответов
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Обработка OPTIONS запросов явно
@app.route('/api/generate-resume', methods=['OPTIONS'])
def options():
    return '', 200

@app.route('/api/generate-resume', methods=['POST'])
def generate_resume_endpoint():
    try:
        logger.info("Received request to /api/generate-resume")
        
        if not request.is_json:
            logger.warning("Request does not contain JSON data")
            return jsonify({
                'success': False,
                'message': 'Ожидается JSON в теле запроса'
            }), 400
            
        data = request.json
        logger.info(f"Received data: {data}")
        
        user_data = data.get('user_data', {})
        resume_type = data.get('resume_type', 'standard')
        
        # Генерация резюме
        logger.info(f"Generating resume with type: {resume_type}")
        resume_content = generate_resume(user_data, resume_type)
        
        logger.info("Resume generated successfully")
        return jsonify({
            'success': True,
            'resume': resume_content,
            'message': 'Резюме успешно сгенерировано'
        })
    except Exception as e:
        logger.error(f"Error generating resume: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'message': f'Ошибка при генерации резюме: {str(e)}'
        }), 500

# Маршрут для проверки работоспособности API
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'API is up and running'
    })

if __name__ == '__main__':
    # Создаем папку для загрузок, если её нет
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    
    # Запускаем сервер в режиме отладки
    app.run(debug=True, port=5000, host='0.0.0.0')
