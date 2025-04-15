# AI Генератор резюме v0.1
 AI Генератор резюме - магистерский проект к выпуску 2026 года.


## Особенности

## Установка
### Сборка из исходников

1. Клонируйте репозиторий:
   ```
   git clone https://github.com/WendemBox/AI-powered_resume_generator.git
   cd AI-powered_resume_generator
   ``` 

2. Установите зависимости backend:
   ```
   pip intsall flask
   pip intsall flask_cors
   pip intsall dotenv
   ```   

3. Запустите backend:
   ```
   cd backend
   python3 app.py
   ```

4. Установите зависимости frontend:
   ```
   npm install jspdf html2canvas
   npm install docx file-saver
   ```
   
5. Запустите frontend:
   ```
   cd frontend 
   npm start
   ```

## Настройка

Создайте файл `.env` в дирректории backend:

Содержимое файла `.env`:

```
OPENAI_API_KEY="ваш_api_ключ"
OPENAI_API_BASE="https://api.openai.com/v1" # опционально, если вы используете другой endpoint
OPENAI_MODEL="gpt-3.5-turbo" # опционально, модель по умолчанию
```

Перейти в адресной строке по адресу: ```http://адрес_сервера:3000```
