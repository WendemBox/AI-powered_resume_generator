import requests
import os
import time
import logging
from dotenv import load_dotenv
import jwt
import datetime

load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('yagpt_requests.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class YandexGPT:
    def __init__(self):
        self.iam_token = os.getenv('YC_IAM_TOKEN')
        self.folder_id = os.getenv('YC_FOLDER_ID')
        self.api_url = "https://llm.api.cloud.yandex.net/foundationModels/v1/completion"
        
    def _get_iam_token(self):
        """Получает IAM токен через Yandex Cloud API"""
        if not all([os.getenv('YC_SERVICE_ACCOUNT_ID'), 
                   os.getenv('YC_ACCESS_KEY_ID'), 
                   os.getenv('YC_PRIVATE_KEY')]):
            return self.iam_token
            
        token_url = "https://iam.api.cloud.yandex.net/iam/v1/tokens"
        jwt_token = self._create_jwt()
        
        try:
            response = requests.post(token_url, json={"jwt": jwt_token})
            response.raise_for_status()
            return response.json().get("iamToken")
        except Exception as e:
            logger.error(f"Failed to get IAM token: {str(e)}")
            return self.iam_token
    
    def _create_jwt(self):
        """Создает JWT для получения IAM токена"""
        now = datetime.datetime.utcnow()
        service_account_id = os.getenv('YC_SERVICE_ACCOUNT_ID')
        key_id = os.getenv('YC_ACCESS_KEY_ID')
        private_key = os.getenv('YC_PRIVATE_KEY').replace('\\n', '\n')
        
        payload = {
            "aud": "https://iam.api.cloud.yandex.net/iam/v1/tokens",
            "iss": service_account_id,
            "iat": now,
            "exp": now + datetime.timedelta(hours=1)
        }
        
        return jwt.encode(
            payload,
            private_key,
            algorithm="PS256",
            headers={"kid": key_id}
        )
        
    def generate(self, prompt):
        """Отправляет запрос к Yandex GPT API"""
        headers = {
            "Authorization": f"Bearer {self._get_iam_token()}",
            "x-folder-id": self.folder_id,
            "Content-Type": "application/json"
        }
        
        data = {
            "modelUri": f"gpt://{self.folder_id}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.6,
                "maxTokens": 2000
            },
            "messages": [
                {
                    "role": "system",
                    "text": (
                        "Ты профессиональный HR-специалист. Создай четкое, структурированное резюме на русском языке "
                        "в формате Markdown. Используй заголовки, списки и форматирование для лучшей читаемости."
                    )
                },
                {
                    "role": "user",
                    "text": prompt
                }
            ]
        }
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                logger.info(f"Sending request to Yandex GPT (attempt {attempt + 1})")
                response = requests.post(self.api_url, headers=headers, json=data)
                response.raise_for_status()
                result = response.json()
                
                if 'result' not in result or 'alternatives' not in result['result']:
                    raise ValueError("Invalid response format from Yandex GPT")
                
                return result['result']['alternatives'][0]['message']['text']
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 401:  # Token expired
                    self.iam_token = self._get_iam_token()
                    headers["Authorization"] = f"Bearer {self.iam_token}"
                    continue
                logger.error(f"HTTP Error: {str(e)}")
                raise Exception(f"Yandex GPT error: HTTP {e.response.status_code}")
            except Exception as e:
                logger.error(f"Error in Yandex GPT request: {str(e)}")
                if attempt == max_retries - 1:
                    raise Exception(f"Failed to get response from Yandex GPT: {str(e)}")
                time.sleep(1)
        
        raise Exception("Yandex GPT error: Max retries exceeded")

def generate_resume(user_data, resume_type='standard'):
    """Генерирует резюме на основе данных пользователя"""
    yagpt = YandexGPT()
    prompt = create_prompt(user_data, resume_type)
    return yagpt.generate(prompt)

def create_prompt(user_data, resume_type):
    """Создает промт для Yandex GPT на основе данных пользователя"""
    format_instructions = {
        'standard': "классический формат с четким структурированием разделов",
        'chronological': "хронологический формат с акцентом на опыт работы в обратном хронологическом порядке",
        'functional': "функциональный формат с акцентом на навыки и достижения",
        'targeted': "целевое резюме, адаптированное под конкретную вакансию",
        'creative': "креативный формат с уникальным стилем",
        'academic': "академический формат с акцентом на образование и публикации",
        'it': "формат для IT-специалиста с техническими деталями",
        'business': "деловой формат с бизнес-метриками"
    }.get(resume_type, "профессиональный формат")
    
    target_position = user_data.get('target_position', '')
    position_context = f" для позиции {target_position}" if target_position else ""
    
    prompt = f"""
    Создай профессиональное резюме на русском языке в {format_instructions}{position_context}.
    Используй Markdown-разметку для форматирования.

    ### Основные данные:
    - Имя: {user_data.get('name', 'Не указано')}
    - Контакты: {user_data.get('contacts', 'Не указаны')}
    - Целевая позиция: {target_position or 'Не указана'}

    ### О себе:
    {user_data.get('about', 'Не указано')}

    ### Ключевые навыки:
    {format_list(user_data.get('skills', []))}

    ### Опыт работы:
    {format_list(user_data.get('experience', []), include_dates=True)}

    ### Образование:
    {format_list(user_data.get('education', []), include_dates=True)}

    ### Достижения:
    {format_list(user_data.get('achievements', []))}

    ### Дополнительная информация:
    {user_data.get('additional_info', 'Не указано')}

    ### Инструкции:
    1. Используй профессиональный язык
    2. Выдели ключевые моменты для {target_position or 'указанной сферы'}
    3. Добавь количественные показатели где возможно
    4. Оптимизируй под {format_instructions}
    5. Верни результат в формате Markdown
    """
    return prompt

def format_list(items, include_dates=False):
    """Форматирует список элементов для промта"""
    if not items:
        return "Не указано"
    
    formatted = []
    for item in items:
        if include_dates and any(x in item.lower() for x in ['год', 'лет', 'года', 'месяц']):
            formatted.append(f"- {item} (укажи временные периоды явно)")
        else:
            formatted.append(f"- {item}")
    
    return "\n".join(formatted) if formatted else "Не указано"