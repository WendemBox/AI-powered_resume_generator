import requests
import os
import json
import time
from dotenv import load_dotenv
import logging

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
        jwt = self._create_jwt()
        
        try:
            response = requests.post(token_url, json={"jwt": jwt})
            response.raise_for_status()
            return response.json().get("iamToken")
        except Exception as e:
            logger.error(f"Failed to get IAM token: {str(e)}")
            return self.iam_token
    
    def _create_jwt(self):
        """Создает JWT для получения IAM токена"""
        import jwt
        import datetime
        
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
        headers = {
            "Authorization": f"Bearer {self._get_iam_token()}",
            "x-folder-id": self.folder_id,
            "Content-Type": "application/json"
        }
        
        data = {
            "modelUri": f"gpt://{self.folder_id}/yandexgpt-lite",
            "completionOptions": {
                "stream": False,
                "temperature": 0.7,
                "maxTokens": 1500
            },
            "messages": [
                {
                    "role": "system",
                    "text": "Ты профессиональный HR-специалист. Создай четкое резюме на русском языке."
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
                    raise Exception(f"Yandex GPT error: {str(e)}")
                time.sleep(1)
        
        raise Exception("Yandex GPT error: Max retries exceeded")

def generate_resume(user_data, resume_type='standard'):
    """Генерирует резюме на основе данных пользователя"""
    yagpt = YandexGPT()
    prompt = create_prompt(user_data, resume_type)
    return yagpt.generate(prompt)

# def create_prompt(user_data, resume_type):
    """Создает промт для Yandex GPT"""
    base_prompt = f"""
    Создай профессиональное резюме на русском языке в формате {resume_type} на основе следующих данных:
    
    Имя: {user_data.get('name', '')}
    Контактная информация: {user_data.get('contacts', '')}
    О себе: {user_data.get('about', '')}
    
    Образование: {format_list(user_data.get('education', []))}
    Опыт работы: {format_list(user_data.get('experience', []))}
    Навыки: {format_list(user_data.get('skills', []))}
    Достижения: {format_list(user_data.get('achievements', []))}
    
    Дополнительная информация: {user_data.get('additional_info', '')}
    
    Верни результат в формате Markdown.
    """
    return base_prompt

# def format_list(items):
    return "\n".join([f"- {item}" for item in items]) if items else "Не указано"

def create_prompt(user_data, resume_type):
    """Создает промт для Yandex GPT"""
    
    # Определение форматирования в зависимости от типа резюме
    format_instructions = {
        'standard': "классический формат с четким структурированием разделов",
        'creative': "творческий формат с уникальным стилем, подчеркивающим индивидуальность",
        'academic': "академический формат с акцентом на научные достижения и публикации",
        'it': "формат для IT-специалиста с акцентом на технические навыки и проекты",
        'business': "деловой формат с фокусом на достижения и бизнес-метрики"
    }.get(resume_type, "профессиональный формат")
    
    # Определение целевой позиции (если указана)
    target_position = user_data.get('target_position', '')
    position_context = f"для позиции {target_position}" if target_position else ""
    
    base_prompt = f"""
    Выступи в роли профессионального HR-специалиста и создай привлекательное резюме на русском языке в {format_instructions} {position_context}.
    
    Используй следующие данные:
    
    ### ПЕРСОНАЛЬНАЯ ИНФОРМАЦИЯ
    ФИО: {user_data.get('name', '')}
    Контакты: {user_data.get('contacts', '')}
    
    ### ПРОФЕССИОНАЛЬНЫЙ ПРОФИЛЬ
    {user_data.get('about', 'Не указано')}
    
    ### ОБРАЗОВАНИЕ
    {format_list(user_data.get('education', []), include_years=True)}
    
    ### ОПЫТ РАБОТЫ
    {format_list(user_data.get('experience', []), include_years=True, include_achievements=True)}
    
    ### ПРОФЕССИОНАЛЬНЫЕ НАВЫКИ
    {format_list(user_data.get('skills', []), categorize=True)}
    
    ### ДОСТИЖЕНИЯ И НАГРАДЫ
    {format_list(user_data.get('achievements', []))}
    
    ### ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ
    {user_data.get('additional_info', '')}
    
    ## ИНСТРУКЦИИ ПО ФОРМАТИРОВАНИЮ:
    1. Используй профессиональный и лаконичный язык
    2. Выдели ключевые навыки и достижения, релевантные {target_position if target_position else "указанной области"}
    3. Используй активные глаголы для описания опыта работы
    4. Приоритизируй недавний опыт и наиболее значимые достижения
    5. Включи количественные показатели достижений где возможно (%, цифры, метрики)
    6. Адаптируй контент под {format_instructions}
    7. Исключи любую неуместную или избыточную информацию
    
    Верни результат в формате Markdown, с четким разделением секций.
    """
    return base_prompt

def format_list(items, include_years=False, include_achievements=False, categorize=False):
    """
    Форматирует список элементов с дополнительными опциями
    
    Args:
        items: список элементов для форматирования
        include_years: добавить обработку дат/периодов (для опыта/образования)
        include_achievements: добавить обработку достижений в опыте работы
        categorize: организовать список по категориям (для навыков)
    """
    if not items:
        return "Не указано"
    
    # Простое форматирование для базового случая
    if not any([include_years, include_achievements, categorize]):
        return "\n".join([f"- {item}" for item in items])
    
    # Пример форматирования с дополнительной логикой
    # В реальном коде здесь была бы более сложная обработка
    formatted = "\n".join([f"- {item}" for item in items])
    
    # Сообщение для модели о необходимости структурирования
    if include_years:
        formatted += "\n(Пожалуйста, структурируй даты/периоды в хронологическом порядке)"
    
    if include_achievements:
        formatted += "\n(Выдели конкретные достижения на каждой позиции)"
    
    if categorize:
        formatted += "\n(Сгруппируй навыки по категориям: технические, soft skills, языки и т.д.)"
    
    return formatted