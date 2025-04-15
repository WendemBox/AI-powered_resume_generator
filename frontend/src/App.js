import React, { useState } from 'react';
import './App.css'; 

function App() {
  const [userData, setUserData] = useState({
    name: '',
    contacts: '',
    about: '',
    education: [],
    experience: [],
    skills: [],
    achievements: [],
    additional_info: ''
  });
  const [resumeType, setResumeType] = useState('standard');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...userData[field]];
    newArray[index] = value;
    setUserData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setUserData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    const newArray = userData[field].filter((_, i) => i !== index);
    setUserData(prev => ({ ...prev, [field]: newArray }));
  };

  const generateResume = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_data: userData,
          resume_type: resumeType
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedResume(data.resume);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Ошибка при соединении с сервером');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Генератор резюме с помощью ИИ</h1>
        <p>Автоматическое создание профессиональных резюме</p>
      </header>
      
      <div className="container">
        <div className="form-section">
          <h2>Личная информация</h2>
          <div className="form-group">
            <label>ФИО</label>
            <input
              type="text"
              name="name"
              placeholder="Иванов Иван Иванович"
              value={userData.name}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Контактная информация</label>
            <input
              type="text"
              name="contacts"
              placeholder="Телефон, email, LinkedIn"
              value={userData.contacts}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>О себе</label>
            <textarea
              name="about"
              placeholder="Краткое профессиональное описание"
              value={userData.about}
              onChange={handleInputChange}
            />
          </div>
          
          <FormSection 
            title="Образование"
            items={userData.education}
            onAdd={() => addArrayItem('education')}
            onChange={(index, value) => handleArrayChange('education', index, value)}
            onRemove={(index) => removeArrayItem('education', index)}
            placeholder="Учебное заведение, степень, годы обучения"
          />
          
          <FormSection 
            title="Опыт работы"
            items={userData.experience}
            onAdd={() => addArrayItem('experience')}
            onChange={(index, value) => handleArrayChange('experience', index, value)}
            onRemove={(index) => removeArrayItem('experience', index)}
            placeholder="Должность, компания, период работы, обязанности"
          />
          
          <FormSection 
            title="Навыки"
            items={userData.skills}
            onAdd={() => addArrayItem('skills')}
            onChange={(index, value) => handleArrayChange('skills', index, value)}
            onRemove={(index) => removeArrayItem('skills', index)}
            placeholder="Профессиональные и технические навыки"
          />
          
          <FormSection 
            title="Достижения"
            items={userData.achievements}
            onAdd={() => addArrayItem('achievements')}
            onChange={(index, value) => handleArrayChange('achievements', index, value)}
            onRemove={(index) => removeArrayItem('achievements', index)}
            placeholder="Конкретные достижения с цифрами"
          />
          
          <div className="form-group">
            <label>Дополнительная информация</label>
            <textarea
              name="additional_info"
              placeholder="Сертификаты, языки, хобби"
              value={userData.additional_info}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label>Тип резюме</label>
            <select 
              value={resumeType} 
              onChange={(e) => setResumeType(e.target.value)}
              className="resume-type-select"
            >
              <option value="standard">Стандартное</option>
              <option value="chronological">Хронологическое</option>
              <option value="functional">Функциональное</option>
              <option value="targeted">Целевое (под вакансию)</option>
            </select>
          </div>
          
          <button 
            onClick={generateResume} 
            disabled={isLoading}
            className="generate-btn"
          >
            {isLoading ? 'Генерация...' : 'Сгенерировать резюме'}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        <div className="resume-section">
          <div className="resume-header">
            <h2>Ваше резюме</h2>
            {generatedResume && (
              <div className="resume-actions">
                <button className="download-btn">PDF</button>
                <button className="download-btn">DOCX</button>
                <button className="share-btn">Поделиться</button>
              </div>
            )}
          </div>
          
          <div className="resume-preview">
            {generatedResume ? (
              <div className="markdown-content" dangerouslySetInnerHTML={{ 
                __html: generatedResume
                  .replace(/\n/g, '<br>')
                  .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                  .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                  .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
              }} />
            ) : (
              <div className="empty-resume">
                <p>Заполните форму и нажмите "Сгенерировать резюме"</p>
                <p>Система использует Искусственный интеллект для создания профессионального резюме</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer>
        <p>Система автоматического создания резюме с ИИ | Дипломный проект</p>
      </footer>
    </div>
  );
}

const FormSection = ({ title, items, onAdd, onChange, onRemove, placeholder }) => (
  <div className="form-section-group">
    <h3>{title}</h3>
    {items.map((item, index) => (
      <div key={index} className="array-item">
        <input
          type="text"
          value={item}
          onChange={(e) => onChange(index, e.target.value)}
          placeholder={placeholder}
        />
        <button 
          onClick={() => onRemove(index)}
          className="remove-btn"
        >
          ×
        </button>
      </div>
    ))}
    <button onClick={onAdd} className="add-btn">
      + Добавить
    </button>
  </div>
);

export default App;
