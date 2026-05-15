import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { FiCompass, FiFileText, FiStar, FiShoppingBag, FiUser, FiZap, FiAward } from 'react-icons/fi';
import '../styles/Dashboard.css'; 
import '../styles/InstructionsPage.css';

const TABS = [
  { id: 'start', icon: <FiCompass />, label: 'Як це працює (Основи)' },
  { id: 'activities', icon: <FiFileText />, label: 'Заявки та Допомога' },
  { id: 'gamification', icon: <FiStar />, label: 'XP, Рівні та Бейджі' },
  { id: 'shop', icon: <FiShoppingBag />, label: 'Магазин та ImpactCoins' },
  { id: 'profile', icon: <FiUser />, label: 'Профіль та Кастомізація' }
];

const InstructionsPage = () => {
  const [activeTab, setActiveTab] = useState('start');

  const renderContent = () => {
    switch (activeTab) {
      case 'start':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon"><FiCompass /></span> З чого почати?</h2>
            <div className="instruction-block">
              <h3>Привіт! Вітаємо в ImpactPulse</h3>
              <p>Ми створили це місце, щоб зробити благодійність і волонтерство ще крутішими. Ти робиш добрі справи, а ми допомагаємо перетворити це на цікавий процес із реальними нагородами.</p>
              <p>Все працює максимально просто: ти донатиш або волонтериш, ділишся цим на платформі і отримуєш за це визнання у вигляді <strong>Досвіду (XP)</strong> та спеціальних монет <strong>(ImpactCoins)</strong>.</p>
            </div>
            
            <div className="instruction-block">
              <h3>Як це працює крок за кроком:</h3>
              <ul>
                <li>Знаходиш цікавий збір чи ініціативу в системі.</li>
                <li>Робиш свою добру справу (переказуєш кошти або допомагаєш руками).</li>
                <li>Закидаєш скріншот чи фото нам через кнопку "Додати Допомогу".</li>
                <li>Ми швиденько все перевіряємо, і твій рейтинг злітає вгору!</li>
              </ul>
            </div>
            
            <div className="pro-tip">
              <span className="pro-tip-icon"><FiZap /></span>
              <div className="pro-tip-content">
                <h4>Кожна дія має значення!</h4>
                <p>Навіть якщо ти просто зайшов у додаток або залишив коментар підтримки — ти вже допомагаєш спільноті, і ми за це нагороджуємо.</p>
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon"><FiFileText /></span> Заявки та Підтвердження</h2>
            <div className="instruction-block">
              <h3>Як подати заявку?</h3>
              <p>Заходиш у розділ "Додати Допомогу". Якщо допомагав конкретному збору з нашого списку — просто обери його. Якщо ні — не страшно, залишай поле пустим. Головне правило: обов'язково прикріпи <strong>скріншот квитанції</strong> або фото з місця події, щоб ми могли все підтвердити.</p>
            </div>
            
            <div className="instruction-block">
              <h3>Що відбувається з твоєю заявкою далі:</h3>
              <ul>
                <li><span className="status-badge status-pending">В очікуванні</span> Заявка полетіла до нас. Ми перевіряємо кожну вручну, тому треба трішки почекати.</li>
                <li><span className="status-badge status-approved">Схвалено</span> Усе супер! Докази прийняті, а твої бали та монети вже зараховані на рахунок.</li>
                <li><span className="status-badge status-rejected">Відхилено</span> Якщо скріншот розмитий або виникли якісь питання. Ми завжди залишаємо коментар — зазирни в "Мої внески", щоб дізнатися причину та виправити її.</li>
              </ul>
            </div>
          </div>
        );

      case 'gamification':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon"><FiStar /></span> Досвід, Рівні та Бейджі</h2>
            <div className="instruction-block">
              <h3>Як рости в рейтингу (XP)</h3>
              <p>XP (Досвід) — це показник твого загального впливу. Що більше ти допомагаєш, то вищий твій рівень: від 'Новобранця' до 'Героя'.</p>
              <ul>
                <li><strong>Донати та волонтерство:</strong> Приносять найбільше XP. Чим більший внесок, тим більше балів може накинути адмін.</li>
                <li><strong>Щоденні квести:</strong> У Центрі Нагород на тебе щодня чекають 3 прості завдання (наприклад, зайти в додаток чи прокоментувати збір).</li>
                <li><strong>Стріки (Streaks):</strong> Заходь в ImpactPulse щодня! Кожні 3, 7 або 30 днів поспіль ми насипаємо круті бонуси.</li>
              </ul>
            </div>
            
            <div className="instruction-block">
              <h3>Твої Нагороди</h3>
              <p>За особливі досягнення (наприклад, перший донат чи місяць активності) ти автоматично отримуватимеш унікальні <strong>Бейджі</strong>. Це твої нагороди, якими можна пишатися в таблиці лідерів.</p>
            </div>
          </div>
        );

      case 'shop':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon"><FiShoppingBag /></span> Магазин та ImpactCoins</h2>
            <div className="instruction-block">
              <h3>Монети, які можна витрачати</h3>
              <p>Якщо XP — це твій авторитет, то ImpactCoins — це реальна валюта платформи. Курс максимально простий: <strong>за кожні 10 отриманих XP ти автоматично заробляєш 1 ImpactCoin</strong>.</p>
            </div>
            
            <div className="instruction-block">
              <h3>На що їх витратити?</h3>
              <p>Залітай у наш Impact Shop! Там можна обміняти монети на приємні бонуси:</p>
              <ul>
                <li><strong>Знижки від партнерів:</strong> Промокоди на каву, пальне чи круті сервіси від брендів, які нас підтримують.</li>
                <li><strong>Ексклюзивні Бейджі:</strong> Преміальні відзнаки, які неможливо отримати просто за квести.</li>
                <li><strong>Кастомізація:</strong> Унікальні рамки та стилі, щоб твій профіль виглядав розкішно.</li>
              </ul>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon"><FiUser /></span> Профіль та Твій Стиль</h2>
            <div className="instruction-block">
              <h3>Особистий кабінет</h3>
              <p>Тут зібрана вся твоя історія: скільки ти загалом задонатив, скільки завдань виконав і наскільки крутим є твій загальний імпакт за весь час.</p>
            </div>
            
            <div className="instruction-block">
              <h3>Як виділитися серед інших?</h3>
              <p>Ти можеш налаштувати свій профіль, щоб він виглядав справді унікально:</p>
              <ul>
                <li><strong>Рамки для аватара:</strong> Від класичних золотих до неонових чи вогняних. Вони відображатимуться у всіх таблицях лідерів!</li>
                <li><strong>Теми фону:</strong> Змінюй задній фон свого профілю на атмосферні градієнти (Кіберпанк, Океан, Захід сонця).</li>
                <li><strong>Іконка нікнейму:</strong> Додай спеціальний значок, який стоятиме поруч із твоїм іменем.</li>
              </ul>
            </div>
            
            <div className="pro-tip">
              <span className="pro-tip-icon"><FiAward /></span>
              <div className="pro-tip-content">
                <h4>Створюй власні комбінації</h4>
                <p>Усі стилі, куплені в магазині, можна вмикати або вимикати будь-коли. Зроби так, щоб тебе 100% помітили!</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            
            <div className="instructions-hero">
              <p className="small-title">База знань</p>
              <h2>Інструкція Користувача</h2>
              <p className="hero-description">Все, що потрібно знати про роботу ImpactPulse: від подачі заявок до обміну балів на реальні нагороди.</p>
            </div>

            <div className="instructions-layout">
              <nav className="instructions-nav">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    className={`instruction-tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
              
              <div className="instructions-content">
                {renderContent()}
              </div>
            </div>

          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default InstructionsPage;