import requests
import os
import time
import logging
from dotenv import load_dotenv
import jwt
import datetime

load_dotenv()

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
            "modelUri": f"gpt://{self.folder_id}/yandexgpt-lite/rc",
            "completionOptions": {
                "stream": False,
                "temperature": 0.8,
                "maxTokens": 4000
            },
            "messages": [
                {
                    "role": "system",
                    "text": (
                        "Ты профессиональный HR-специалист. Создай персонализированное резюме на русском языке "
                        "в формате Markdown на основе точных данных пользователя. Используй заголовки, списки и форматирование. "
                        "Учитывай все предоставленные данные. Сделай резюме уникальным и адаптированным под указанную должность. "
                        "Добавь конкретные цифры и показатели в достижениях. Используй профессиональный язык."
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
                
                logger.info(f"Full Yandex GPT response: {result}")
                
                if 'result' not in result or 'alternatives' not in result['result']:
                    raise ValueError("Invalid response format from Yandex GPT")
                
                return result['result']['alternatives'][0]['message']['text']
                
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 401:
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
    yagpt = YandexGPT()
    prompt = create_prompt(user_data, resume_type)
    logger.info(f"Generated prompt for Yandex GPT: {prompt}")
    return yagpt.generate(prompt)

def create_prompt(user_data, resume_type):
    format_instructions = {
        'standard': "классический формат с четким структурированием разделов",
        'chronological': "хронологический формат с акцентом на опыт работы",
        'functional': "функциональный формат с акцентом на навыки",
        'targeted': "целевое резюме, адаптированное под конкретную вакансию",
        'creative': "креативный формат с уникальным стилем"
    }.get(resume_type, "профессиональный формат")
    
    target_position = user_data.get('target_position', '')
    position_context = f" для позиции {target_position}" if target_position else ""
    
    prompt = f"""
    Создай профессиональное резюме на русском языке в {format_instructions}{position_context}.
    Используй Markdown-разметку. Включи все предоставленные данные.

    ### Основные данные:
    - Полное имя: {user_data.get('name', 'Не указано')}
    - Контакты: {user_data.get('contacts', 'Не указаны')}
    - Целевая позиция: {target_position or 'Не указана'}
    - О себе: {user_data.get('about', 'Не указано')}

    ### Ключевые навыки:
    {format_list(user_data.get('skills', []), include_level=True)}

    ### Опыт работы:
    {format_list(user_data.get('experience', []), include_dates=True, detailed=True)}

    ### Образование:
    {format_list(user_data.get('education', []), include_dates=True)}

    ### Достижения:
    {format_list(user_data.get('achievements', []), quantified=True)}

    ### Дополнительная информация:
    {user_data.get('additional_info', 'Не указано')}

    ### Инструкции:
    1. Сделай резюме уникальным и персонализированным
    2. Используй профессиональный язык
    3. Добавь количественные показатели везде, где возможно
    4. Адаптируй содержание под целевую позицию
    5. Соблюдай структуру и формат Markdown
    """
    return prompt

def format_list(items, include_dates=False, include_level=False, detailed=False, quantified=False):
    if not items:
        return "Не указано"
    
    formatted = []
    for item in items:
        line = "- "
        if include_dates and any(x in item.lower() for x in ['год', 'лет', 'года', 'месяц']):
            line += f"{item} (укажи временные периоды явно)"
        elif include_level:
            line += f"{item} [укажи уровень владения]"
        elif detailed:
            line += f"{item}. Подробно опиши обязанности и достижения"
        elif quantified:
            line += f"{item}. Укажи конкретные результаты с цифрами"
        else:
            line += item
        
        formatted.append(line)
    
    return "\n".join(formatted) if formatted else "Не указано"