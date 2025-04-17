import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  FaSun, 
  FaMoon, 
  FaDownload, 
  FaShare, 
  FaFilePdf, 
  FaFileWord, 
  FaMagic, 
  FaChartBar, 
  FaHistory, 
  FaCloudUploadAlt, 
  FaLanguage, 
  FaSearch, 
  FaGamepad,
  FaAward,
  FaCheckCircle,
  FaGlobe
} from 'react-icons/fa';

function App() {
  // Основные состояния
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
  const [error, setError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState({ 
    type: '', 
    loading: false, 
    error: '' 
  });

  // Новые состояния для улучшений
  const [activeTemplate, setActiveTemplate] = useState('modern');
  const [analysis, setAnalysis] = useState({ score: 0, suggestions: [] });
  const [resumeHistory, setResumeHistory] = useState([]);
  const [language, setLanguage] = useState('ru');
  const [vacancies, setVacancies] = useState([]);
  const [progress, setProgress] = useState({ filled: 0, total: 10 });
  const [achievements, setAchievements] = useState([]);
  const [exportOptions, setExportOptions] = useState({ 
    format: 'pdf', 
    includePhoto: false,
    sections: {
      education: true,
      experience: true,
      skills: true,
      achievements: true
    }
  });
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showExportModal, setShowExportModal] = useState(false);
  const [atsResult, setAtsResult] = useState(null);

  // Шаблоны резюме
  const templates = [
    { id: 'modern', name: 'Современный', preview: '/templates/modern.png' },
    { id: 'classic', name: 'Классический', preview: '/templates/classic.png' },
    { id: 'creative', name: 'Креативный', preview: '/templates/creative.png' },
    { id: 'academic', name: 'Академический', preview: '/templates/academic.png' }
  ];

  // Примеры данных для разных профессий
  const examples = {
    it: {
      target_position: 'Frontend Developer',
      skills: ['JavaScript', 'React', 'HTML/CSS', 'Git'],
      about: 'Фронтенд-разработчик с 3-летним опытом создания SPA-приложений.',
      achievements: [
        'Увеличил производительность приложения на 40% через оптимизацию кода',
        'Внедрил новые технологии, что сократило время разработки на 25%'
      ]
    },
    marketing: {
      target_position: 'Маркетолог',
      skills: ['SMM', 'Аналитика', 'Копирайтинг', 'Google Ads'],
      about: 'Маркетолог с опытом ведения рекламных кампаний и увеличения конверсии.',
      achievements: [
        'Увеличил конверсию сайта с 2% до 5% за 3 месяца',
        'Сократил стоимость лида на 30% через оптимизацию рекламных каналов'
      ]
    }
  };

  // Переводы
  const translations = {
    ru: {
      name: 'ФИО',
      position: 'Целевая позиция',
      contacts: 'Контакты',
      about: 'О себе',
      education: 'Образование',
      experience: 'Опыт работы',
      skills: 'Навыки',
      achievements: 'Достижения',
      additional: 'Дополнительно',
      generate: 'Сгенерировать резюме',
      resume: 'Ваше резюме',
      download: 'Скачать',
      share: 'Поделиться',
      examples: 'Примеры заполнения',
      templates: 'Шаблоны резюме',
      suggestions: 'Рекомендации',
      atsCheck: 'Проверить ATS',
      history: 'История изменений',
      vacancies: 'Подходящие вакансии',
      export: 'Экспорт',
      offline: 'Автономный режим'
    },
    en: {
      name: 'Full Name',
      position: 'Target Position',
      contacts: 'Contacts',
      about: 'About Me',
      education: 'Education',
      experience: 'Experience',
      skills: 'Skills',
      achievements: 'Achievements',
      additional: 'Additional Info',
      generate: 'Generate Resume',
      resume: 'Your Resume',
      download: 'Download',
      share: 'Share',
      examples: 'Fill Examples',
      templates: 'Resume Templates',
      suggestions: 'Suggestions',
      atsCheck: 'Check ATS',
      history: 'History',
      vacancies: 'Matching Vacancies',
      export: 'Export',
      offline: 'Offline Mode'
    }
  };

  // Анализ заполненности резюме
  useEffect(() => {
    const fields = [
      userData.name,
      userData.target_position,
      userData.contacts,
      userData.about,
      ...userData.education,
      ...userData.experience,
      ...userData.skills,
      ...userData.achievements,
      userData.additional_info
    ].filter(v => v !== '').length;

    const totalFields = 10; // Общее количество значимых полей
    
    setProgress({
      filled: fields,
      total: totalFields
    });

    // Генерация рекомендаций
    const suggestions = [];
    if (!userData.achievements.length) {
      suggestions.push(language === 'ru' 
        ? 'Добавьте 2-3 конкретных достижения с цифрами' 
        : 'Add 2-3 specific achievements with numbers');
    }
    if (!userData.about) {
      suggestions.push(language === 'ru'
        ? 'Заполните раздел "О себе" - это важно для рекрутеров'
        : 'Fill the "About Me" section - it\'s important for recruiters');
    }
    if (userData.skills.length < 3) {
      suggestions.push(language === 'ru'
        ? 'Добавьте больше навыков (минимум 3)'
        : 'Add more skills (at least 3)');
    }
    
    setAnalysis({
      score: Math.round((fields / totalFields) * 100),
      suggestions
    });

    // Проверка достижений
    if (userData.skills.length >= 5 && !achievements.some(a => a.id === 'skills-master')) {
      unlockAchievement('skills-master');
    }
    if (userData.experience.length >= 2 && !achievements.some(a => a.id === 'experienced')) {
      unlockAchievement('experienced');
    }
    if (fields >= totalFields - 2 && !achievements.some(a => a.id === 'complete-profile')) {
      unlockAchievement('complete-profile');
    }
  }, [userData]);

  // Оффлайн-режим
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      syncLocalData();
    };
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Загрузка сохраненных данных
    const savedData = localStorage.getItem('resumeData');
    if (savedData) setUserData(JSON.parse(savedData));
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Сохранение данных в localStorage
  useEffect(() => {
    if (isOffline) {
      localStorage.setItem('resumeData', JSON.stringify(userData));
    }
  }, [userData, isOffline]);

  const syncLocalData = () => {
    const savedData = localStorage.getItem('resumeData');
    if (savedData) {
      // Здесь можно отправить данные на сервер
      localStorage.removeItem('resumeData');
    }
  };

  const unlockAchievement = (id) => {
    const achievementMap = {
      'skills-master': {
        title: language === 'ru' ? 'Мастер навыков' : 'Skills Master',
        icon: <FaAward />
      },
      'experienced': {
        title: language === 'ru' ? 'Опытный профессионал' : 'Experienced Pro',
        icon: <FaCheckCircle />
      },
      'complete-profile': {
        title: language === 'ru' ? 'Полный профиль' : 'Complete Profile',
        icon: <FaGlobe />
      }
    };
    
    setAchievements(prev => [
      ...prev,
      {
        id,
        ...achievementMap[id]
      }
    ]);
  };

  // Заполнить примером
  const fillExample = (profession) => {
    setUserData(prev => ({
      ...prev,
      ...examples[profession]
    }));
    unlockAchievement('example-used');
  };

  // Сохранить в историю
  const saveToHistory = (resume) => {
    setResumeHistory(prev => [
      { 
        content: resume, 
        date: new Date().toISOString(),
        name: `${userData.name || 'Без названия'} - ${new Date().toLocaleString()}`
      },
      ...prev.slice(0, 4)
    ]);
  };

  // Генерация резюме
  const generateResume = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_data: userData,
          resume_type: resumeType,
          template: activeTemplate
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedResume(data.resume);
        saveToHistory(data.resume);
      } else {
        setError(data.message || (language === 'ru' 
          ? 'Ошибка при генерации резюме' 
          : 'Error generating resume'));
      }
    } catch (err) {
      setError(language === 'ru' 
        ? 'Ошибка при соединении с сервером' 
        : 'Server connection error');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Скачивание резюме
  const downloadResume = async (format) => {
    setDownloadStatus({ type: format, loading: true, error: '' });
    
    try {
      const response = await fetch('/api/download-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_content: generatedResume,
          format: format,
          file_name: `${userData.name || 'resume'}_${new Date().toISOString().slice(0,10)}`,
          options: exportOptions
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
        unlockAchievement('downloaded');
      } else {
        const data = await response.json();
        throw new Error(data.message || (language === 'ru' 
          ? 'Ошибка при загрузке файла' 
          : 'File download error'));
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
          title: language === 'ru' ? 'Мое резюме' : 'My Resume',
          text: language === 'ru' 
            ? 'Посмотрите мое резюме, созданное с помощью AI генератора' 
            : 'Check out my AI-generated resume',
          url: window.location.href
        });
        unlockAchievement('shared');
      } else {
        const shareUrl = `mailto:?subject=${language === 'ru' ? 'Мое резюме' : 'My Resume'}&body=${language === 'ru' 
          ? 'Посмотрите мое резюме:' 
          : 'Check out my resume:'} ${window.location.href}`;
        window.open(shareUrl, '_blank');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Проверка ATS
  const checkATS = async () => {
    try {
      const response = await fetch('/api/ats-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: generatedResume })
      });
      const data = await response.json();
      setAtsResult(data);
      unlockAchievement('ats-checked');
    } catch (err) {
      console.error('ATS Check Error:', err);
    }
  };

  // Поиск вакансий
  const searchVacancies = async () => {
    try {
      const response = await fetch(`/api/vacancies?position=${userData.target_position}&lang=${language}`);
      const data = await response.json();
      setVacancies(data);
      unlockAchievement('vacancies-searched');
    } catch (err) {
      console.error('Vacancies Error:', err);
    }
  };

  // Экспорт в облако
  const exportToCloud = async (provider) => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume: generatedResume,
          provider,
          options: exportOptions
        })
      });
      const data = await response.json();
      if (data.success) {
        alert(language === 'ru' 
          ? 'Резюме успешно экспортировано!' 
          : 'Resume exported successfully!');
      }
    } catch (err) {
      console.error('Export Error:', err);
    }
  };

  // Переключение темы
  const toggleTheme = () => {
    const newTheme = !darkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setDarkMode(!darkMode);
  };

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

  // Вспомогательные компоненты
  const FormInput = ({ label, name, ...props }) => (
    <div className="form-group">
      <label>{translations[language][label] || label}</label>
      <input name={name} {...props} />
    </div>
  );

  const FormTextarea = ({ label, name, ...props }) => (
    <div className="form-group">
      <label>{translations[language][label] || label}</label>
      <textarea name={name} {...props} />
    </div>
  );

  const FormSection = ({ title, field, items, placeholder }) => (
    <div className="form-section-group">
      <h3>{translations[language][title] || title}</h3>
      {items.map((item, index) => (
        <div key={index} className="array-item">
          <input
            type="text"
            value={item}
            onChange={(e) => handleArrayChange(field, index, e.target.value)}
            placeholder={placeholder}
          />
          <button 
            onClick={() => removeArrayItem(field, index)}
            className="remove-btn"
            aria-label={language === 'ru' ? 'Удалить' : 'Remove'}
          >
            ×
          </button>
        </div>
      ))}
      <button onClick={() => addArrayItem(field)} className="add-btn">
        + {language === 'ru' ? 'Добавить' : 'Add'}
      </button>
    </div>
  );

  const DownloadButton = ({ format, onClick, isLoading }) => (
    <button 
      onClick={() => onClick(format)} 
      disabled={isLoading}
      className={`download-btn ${format}`}
    >
      {format === 'pdf' ? <FaFilePdf /> : <FaFileWord />} 
      {isLoading ? (language === 'ru' ? 'Генерация...' : 'Generating...') : format.toUpperCase()}
    </button>
  );

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

  const EmptyResumePlaceholder = () => (
    <div className="empty-resume">
      <h3>{language === 'ru' ? 'Здесь будет ваше резюме' : 'Your resume will appear here'}</h3>
      <p>{language === 'ru' 
        ? 'Заполните форму слева и нажмите "Сгенерировать резюме"' 
        : 'Fill the form and click "Generate Resume"'}</p>
      <p>{language === 'ru' 
        ? 'Система использует Искусственный интеллект для создания профессионального резюме' 
        : 'The system uses AI to create professional resumes'}</p>
    </div>
  );

  const ExportModal = ({ onClose }) => (
    <div className="modal-overlay">
      <div className="export-modal">
        <h3>{translations[language].export}</h3>
        
        <div className="export-options">
          <label>
            <input 
              type="checkbox" 
              checked={exportOptions.includePhoto}
              onChange={() => setExportOptions({...exportOptions, includePhoto: !exportOptions.includePhoto})}
            />
            {language === 'ru' ? 'Включить фото' : 'Include photo'}
          </label>
          
          <h4>{language === 'ru' ? 'Включить разделы:' : 'Include sections:'}</h4>
          {Object.keys(exportOptions.sections).map(section => (
            <label key={section}>
              <input 
                type="checkbox" 
                checked={exportOptions.sections[section]}
                onChange={() => setExportOptions({
                  ...exportOptions, 
                  sections: {
                    ...exportOptions.sections,
                    [section]: !exportOptions.sections[section]
                  }
                })}
              />
              {translations[language][section] || section}
            </label>
          ))}
        </div>
        
        <div className="export-buttons">
          <button onClick={() => exportToCloud('google')}>
            <FaCloudUploadAlt /> Google Drive
          </button>
          <button onClick={() => exportToCloud('dropbox')}>
            <FaCloudUploadAlt /> Dropbox
          </button>
          <button onClick={onClose}>
            {language === 'ru' ? 'Закрыть' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app">
      <header>
        <button onClick={toggleTheme} className="theme-toggle">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        <h1>{language === 'ru' ? 'Генератор резюме с помощью ИИ' : 'AI Resume Generator'}</h1>
        <p>{language === 'ru' 
          ? 'Автоматическое создание профессиональных резюме' 
          : 'Automated professional resume creation'}</p>
      </header>
      
      <div className="container">
        {/* Форма ввода данных */}
        <div className="form-section">
          <h2>{language === 'ru' ? 'Личная информация' : 'Personal Information'}</h2>
          
          <div className="form-group">
            <label>{translations[language].templates}</label>
            <div className="templates-grid">
              {templates.map(t => (
                <div 
                  key={t.id}
                  className={`template-card ${activeTemplate === t.id ? 'active' : ''}`}
                  onClick={() => setActiveTemplate(t.id)}
                >
                  <div className="template-preview" style={{ 
                    backgroundImage: `url(${t.preview})`,
                    backgroundColor: activeTemplate === t.id ? 'var(--primary-color)' : ''
                  }} />
                  <span>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>{translations[language].examples}</label>
            <div className="example-buttons">
              <button onClick={() => fillExample('it')}>
                {language === 'ru' ? 'IT-специалист' : 'IT Professional'}
              </button>
              <button onClick={() => fillExample('marketing')}>
                {language === 'ru' ? 'Маркетолог' : 'Marketer'}
              </button>
            </div>
          </div>

          <FormInput 
            label="name"
            name="name"
            value={userData.name}
            onChange={handleInputChange}
            placeholder={language === 'ru' ? "Иванов Иван Иванович" : "John Doe"}
          />
          
          <FormInput 
            label="position"
            name="target_position"
            value={userData.target_position}
            onChange={handleInputChange}
            placeholder={language === 'ru' ? "Желаемая должность" : "Desired position"}
          />
          
          <FormInput 
            label="contacts"
            name="contacts"
            value={userData.contacts}
            onChange={handleInputChange}
            placeholder={language === 'ru' ? "Телефон, email, LinkedIn" : "Phone, email, LinkedIn"}
          />
          
          <FormTextarea 
            label="about"
            name="about"
            value={userData.about}
            onChange={handleInputChange}
            placeholder={language === 'ru' 
              ? "Краткое профессиональное описание" 
              : "Short professional summary"}
          />
          
          <FormSection 
            title="education"
            field="education"
            items={userData.education}
            placeholder={language === 'ru' 
              ? "Учебное заведение, степень, годы обучения" 
              : "Institution, degree, years"}
          />
          
          <FormSection 
            title="experience"
            field="experience"
            items={userData.experience}
            placeholder={language === 'ru' 
              ? "Должность, компания, период работы, обязанности" 
              : "Position, company, period, responsibilities"}
          />
          
          <FormSection 
            title="skills"
            field="skills"
            items={userData.skills}
            placeholder={language === 'ru' 
              ? "Профессиональные и технические навыки" 
              : "Professional and technical skills"}
          />
          
          <FormSection 
            title="achievements"
            field="achievements"
            items={userData.achievements}
            placeholder={language === 'ru' 
              ? "Конкретные достижения с цифрами" 
              : "Specific achievements with numbers"}
          />
          
          <FormTextarea 
            label="additional"
            name="additional_info"
            value={userData.additional_info}
            onChange={handleInputChange}
            placeholder={language === 'ru' 
              ? "Сертификаты, языки, хобби" 
              : "Certificates, languages, hobbies"}
          />
          
          <div className="form-group">
            <label>{language === 'ru' ? 'Тип резюме' : 'Resume Type'}</label>
            <select 
              value={resumeType} 
              onChange={(e) => setResumeType(e.target.value)}
              className="resume-type-select"
            >
              <option value="standard">{language === 'ru' ? 'Стандартное' : 'Standard'}</option>
              <option value="chronological">{language === 'ru' ? 'Хронологическое' : 'Chronological'}</option>
              <option value="functional">{language === 'ru' ? 'Функциональное' : 'Functional'}</option>
              <option value="targeted">{language === 'ru' ? 'Целевое' : 'Targeted'}</option>
              <option value="creative">{language === 'ru' ? 'Креативное' : 'Creative'}</option>
            </select>
          </div>
          
          <div className="progress-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(progress.filled / progress.total) * 100}%` }}
              ></div>
            </div>
            <span>
              {language === 'ru' ? 'Заполнено' : 'Completed'}: {progress.filled}/{progress.total}
              {analysis.score > 0 && ` (${analysis.score}%)`}
            </span>
          </div>

          {analysis.suggestions.length > 0 && (
            <div className="suggestions-box">
              <h4>{language === 'ru' ? 'Рекомендации' : 'Suggestions'}:</h4>
              <ul>
                {analysis.suggestions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          <button 
            onClick={generateResume} 
            disabled={isLoading}
            className="generate-btn"
          >
            {isLoading 
              ? (language === 'ru' ? 'Генерация...' : 'Generating...') 
              : translations[language].generate}
          </button>
          
          {error && <div className="error-message">{error}</div>}
        </div>
        
        {/* Превью резюме */}
        <div className="resume-section">
          <div className="resume-header">
            <h2>{translations[language].resume}</h2>
            {generatedResume && (
              <div className="resume-actions">
                <button onClick={checkATS} className="ats-btn">
                  <FaChartBar /> {translations[language].atsCheck}
                </button>
                
                <button onClick={searchVacancies} className="vacancies-btn">
                  <FaSearch /> {translations[language].vacancies}
                </button>
                
                <DownloadButton 
                  format="pdf"
                  onClick={downloadResume}
                  isLoading={downloadStatus.loading && downloadStatus.type === 'pdf'}
                />
                
                <DownloadButton 
                  format="docx"
                  onClick={downloadResume}
                  isLoading={downloadStatus.loading && downloadStatus.type === 'docx'}
                />
                
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="export-btn"
                >
                  <FaCloudUploadAlt /> {translations[language].export}
                </button>
                
                <button 
                  onClick={shareResume}
                  className="share-btn"
                >
                  <FaShare /> {translations[language].share}
                </button>
              </div>
            )}
          </div>
          
          {resumeHistory.length > 0 && (
            <div className="history-dropdown">
              <select 
                onChange={(e) => {
                  if (e.target.value) {
                    setGeneratedResume(resumeHistory[e.target.value].content);
                  }
                }}
              >
                <option value="">{language === 'ru' ? 'Текущая версия' : 'Current version'}</option>
                {resumeHistory.map((item, i) => (
                  <option key={i} value={i}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="resume-preview">
            {generatedResume ? (
              <>
                <MarkdownPreview content={generatedResume} />
                {atsResult && (
                  <div className="ats-result">
                    <h3>{language === 'ru' ? 'Результат ATS проверки' : 'ATS Check Result'}: {atsResult.score}/100</h3>
                    <p>{language === 'ru' ? 'Найдены ключевые слова' : 'Found keywords'}: {atsResult.keywords.join(', ')}</p>
                    <ul>
                      {atsResult.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <EmptyResumePlaceholder />
            )}
            {downloadStatus.error && <div className="error-message">{downloadStatus.error}</div>}
          </div>
        </div>
      </div>
      
      {vacancies.length > 0 && (
        <div className="vacancies-container">
          <h3>{translations[language].vacancies}</h3>
          <div className="vacancies-grid">
            {vacancies.map(v => (
              <div key={v.id} className="vacancy-card">
                <h4>{v.title}</h4>
                <p>{v.company}</p>
                <p>{v.salary || ''}</p>
                <button 
                  onClick={() => window.open(v.link, '_blank')}
                  className="apply-btn"
                >
                  {language === 'ru' ? 'Откликнуться' : 'Apply'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="language-selector">
        <FaLanguage />
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </div>

      {achievements.length > 0 && (
        <div className="achievements-bar">
          {achievements.map(a => (
            <div key={a.id} className="badge">
              {a.icon} {a.title}
            </div>
          ))}
        </div>
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}

      {isOffline && (
        <div className="offline-banner">
          {language === 'ru' 
            ? 'Вы в автономном режиме. Изменения будут сохранены локально.' 
            : 'You are offline. Changes will be saved locally.'}
        </div>
      )}

      <footer>
        <p>
          {language === 'ru' 
            ? 'Система автоматического создания резюме с ИИ | Дипломный проект' 
            : 'AI Resume Generator System | Diploma Project'}
        </p>
        <p>
          {language === 'ru' 
            ? 'Доступные форматы: PDF, DOCX | Возможности: генерация, скачивание, шаринг' 
            : 'Formats: PDF, DOCX | Features: generation, download, sharing'}
        </p>
      </footer>
    </div>
  );
}

export default App;