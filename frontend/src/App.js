import React, { useState, useEffect } from 'react';
import './App.css';
import { FaSun, FaMoon, FaDownload, FaShare, FaFilePdf, FaFileWord } from 'react-icons/fa';

function App() {
  const [userData, setUserData] = useState({
    name: '',
    target_position: '',
    contacts: '',
    about: '',
    education: [],
    experience: [],
    skills: [],
    achievements: [],
    additional_info: ''
  });
  const [darkMode, setDarkMode] = useState(false);
  const [resumeType, setResumeType] = useState('standard');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState({ 
    type: '', 
    loading: false, 
    error: '' 
  });

  // Проверяем сохраненную тему при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setDarkMode(!darkMode);
  };

  // Эффект для анимации прогресса
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Обработчики изменений формы
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

  // Генерация резюме через API
  const generateResume = async () => {
    setIsLoading(true);
    setError('');
    setProgress(0);
    
    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_data: userData,
          resume_type: resumeType
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedResume(data.resume);
        setProgress(100);
        setTimeout(() => setProgress(0), 1000);
      } else {
        setError(data.message || 'Произошла ошибка при генерации резюме');
      }
    } catch (err) {
      setError('Ошибка при соединении с сервером');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Скачивание резюме в выбранном формате
  const downloadResume = async (format) => {
    setDownloadStatus({ type: format, loading: true, error: '' });
    
    try {
      const response = await fetch('/api/download-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_content: generatedResume,
          format: format,
          file_name: `${userData.name || 'resume'}_${new Date().toISOString().slice(0,10)}`
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${userData.name || 'resume'}_${new Date().toISOString().slice(0,10)}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Ошибка при загрузке файла');
      }
    } catch (err) {
      setDownloadStatus(prev => ({ ...prev, error: err.message }));
      console.error('Download Error:', err);
    } finally {
      setDownloadStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Поделиться резюме
  const shareResume = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Мое резюме',
          text: 'Посмотрите мое резюме, созданное с помощью AI генератора',
          url: window.location.href
        });
      } else {
        // Fallback для браузеров без Web Share API
        const shareUrl = `mailto:?subject=Мое резюме&body=Посмотрите мое резюме: ${window.location.href}`;
        window.open(shareUrl, '_blank');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="app">
      <header>
        <button onClick={toggleTheme} className="theme-toggle">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        <h1>Генератор резюме с помощью ИИ</h1>
        <p>Автоматическое создание профессиональных резюме</p>
      </header>
      
      <div className="container">
        {/* Форма ввода данных */}
        <div className="form-section">
          <h2>Личная информация</h2>
          
          <FormInput 
            label="ФИО"
            name="name"
            value={userData.name}
            onChange={handleInputChange}
            placeholder="Иванов Иван Иванович"
          />
          
          <FormInput 
            label="Целевая позиция"
            name="target_position"
            value={userData.target_position}
            onChange={handleInputChange}
            placeholder="Желаемая должность"
          />
          
          <FormInput 
            label="Контактная информация"
            name="contacts"
            value={userData.contacts}
            onChange={handleInputChange}
            placeholder="Телефон, email, LinkedIn"
          />
          
          <FormTextarea 
            label="О себе"
            name="about"
            value={userData.about}
            onChange={handleInputChange}
            placeholder="Краткое профессиональное описание"
          />
          
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
          
          <FormTextarea 
            label="Дополнительная информация"
            name="additional_info"
            value={userData.additional_info}
            onChange={handleInputChange}
            placeholder="Сертификаты, языки, хобби"
          />
          
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
              <option value="creative">Креативное</option>
              <option value="academic">Академическое</option>
              <option value="it">IT-специалиста</option>
              <option value="business">Бизнес</option>
            </select>
          </div>
          
          <button 
            onClick={generateResume} 
            disabled={isLoading}
            className="generate-btn"
          >
            {isLoading ? 'Генерация...' : 'Сгенерировать резюме'}
          </button>
          
          {isLoading && (
            <div className="progress-bar">
              <div className="progress" style={{ width: `${progress}%` }}></div>
            </div>
          )}
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {/* Превью резюме */}
        <div className="resume-section">
          <div className="resume-header">
            <h2>Ваше резюме</h2>
            {generatedResume && (
              <div className="resume-actions">
                <DownloadButton 
                  format="pdf"
                  onClick={downloadResume}
                  isLoading={downloadStatus.loading && downloadStatus.type === 'pdf'}
                  icon={<FaFilePdf />}
                />
                <DownloadButton 
                  format="docx"
                  onClick={downloadResume}
                  isLoading={downloadStatus.loading && downloadStatus.type === 'docx'}
                  icon={<FaFileWord />}
                />
                <button 
                  onClick={shareResume}
                  className="share-btn"
                >
                  <FaShare /> Поделиться
                </button>
              </div>
            )}
          </div>
          
          <div className="resume-preview">
            {generatedResume ? (
              <MarkdownPreview content={generatedResume} />
            ) : (
              <EmptyResumePlaceholder />
            )}
            {downloadStatus.error && <div className="error-message">{downloadStatus.error}</div>}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// Компонент для полей ввода
const FormInput = ({ label, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <input type="text" {...props} />
  </div>
);

// Компонент для текстовых областей
const FormTextarea = ({ label, ...props }) => (
  <div className="form-group">
    <label>{label}</label>
    <textarea {...props} />
  </div>
);

// Компонент для секций с массивами
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
          aria-label="Удалить"
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

// Компонент для кнопки скачивания
const DownloadButton = ({ format, onClick, isLoading, icon }) => (
  <button 
    onClick={() => onClick(format)} 
    disabled={isLoading}
    className={`download-btn ${format}`}
  >
    {icon} {isLoading ? 'Генерация...' : format.toUpperCase()}
  </button>
);

// Компонент для превью Markdown
const MarkdownPreview = ({ content }) => (
  <div className="markdown-content" dangerouslySetInnerHTML={{ 
    __html: content
      .replace(/\n/g, '<br>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
  }} />
);

// Компонент для пустого состояния резюме
const EmptyResumePlaceholder = () => (
  <div className="empty-resume">
    <h3>Здесь будет ваше резюме</h3>
    <p>Заполните форму слева и нажмите "Сгенерировать резюме"</p>
    <p>Система использует Искусственный интеллект для создания профессионального резюме</p>
  </div>
);

// Компонент футера
const Footer = () => (
  <footer>
    <p>Система автоматического создания резюме с ИИ | Дипломный проект</p>
    <p>Доступные форматы: PDF, DOCX | Возможности: генерация, скачивание, шаринг</p>
  </footer>
);

export default App;