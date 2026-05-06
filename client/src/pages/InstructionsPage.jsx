import React, { useState } from 'react';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import '../styles/Dashboard.css'; 
import '../styles/InstructionsPage.css';

const TABS = [
  { id: 'start', icon: '🚀', label: 'Як це працює (Основи)' },
  { id: 'activities', icon: '📝', label: 'Заявки та Допомога' },
  { id: 'gamification', icon: '⭐', label: 'XP, Рівні та Бейджі' },
  { id: 'shop', icon: '🪙', label: 'Магазин та ImpactCoins' },
  { id: 'profile', icon: '🎨', label: 'Профіль та Кастомізація' }
];

const InstructionsPage = () => {
  const [activeTab, setActiveTab] = useState('start');

  const renderContent = () => {
    switch (activeTab) {
      case 'start':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon">🚀</span> Як це працює?</h2>
            <div className="instruction-block">
              <h3>Вітаємо в ImpactPulse!</h3>
              <p>Наша платформа створена для того, щоб зробити благодійність та волонтерство цікавішим і прозорішим. Ми перетворюємо добрі справи на захопливу гру.</p>
              <p>Головна ідея дуже проста: ви робите щось корисне (наприклад, донатите на збір або допомагаєте фізично), підтверджуєте це на платформі, і за це отримуєте **Досвід (XP)** та **Монети (ImpactCoins)**.</p>
            </div>
            
            <div className="instruction-block">
              <h3>Ваш шлях героя:</h3>
              <ul>
                <li>Знайдіть цікавий збір чи волонтерську ініціативу в системі.</li>
                <li>Долучіться до неї (зробіть внесок або виконайте завдання).</li>
                <li>Створіть "Заявку" (прикріпіть скріншот квитанції або фото-підтвердження).</li>
                <li>Дочекайтеся перевірки адміністратором.</li>
                <li>Отримайте нагороди, підвищуйте рівень та обмінюйте монети на бонуси!</li>
              </ul>
            </div>
            
            <div className="pro-tip">
              <span className="pro-tip-icon">💡</span>
              <div className="pro-tip-content">
                <h4>Кожна дія має значення</h4>
                <p>Навіть просто щоденний вхід у додаток або спілкування під проєктами нагороджується бонусами. Ваша активність допомагає спільноті зростати!</p>
              </div>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon">📝</span> Заявки та Допомога</h2>
            <div className="instruction-block">
              <h3>Як подати заявку?</h3>
              <p>Перейдіть на сторінку "Додати Допомогу". Оберіть існуючий збір з випадаючого списку (або залишіть поле порожнім, якщо допомагаєте поза платформою). Вкажіть деталі, суму та обов'язково додайте **доказ** (скріншот переказу або фото з місця волонтерства).</p>
            </div>
            
            <div className="instruction-block">
              <h3>Статуси ваших заявок:</h3>
              <ul>
                <li><span className="status-badge status-pending">Pending</span> <strong>В очікуванні:</strong> Ваша заявка створена і чекає на перевірку адміністратором. У цей час бали ще не нараховано.</li>
                <li><span className="status-badge status-approved">Approved</span> <strong>Схвалено:</strong> Адмін перевірив ваші докази. Вам миттєво нараховується XP та ImpactCoins!</li>
                <li><span className="status-badge status-rejected">Rejected</span> <strong>Відхилено:</strong> Якщо докази сумнівні або фото нечітке. В такому разі перейдіть в "Мої внески", щоб прочитати коментар від адміністратора з поясненням.</li>
              </ul>
            </div>
          </div>
        );

      case 'gamification':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon">⭐</span> XP, Рівні та Бейджі</h2>
            <div className="instruction-block">
              <h3>Система Досвіду (XP)</h3>
              <p>Досвід відображає вашу загальну впливовість на платформі. Що більше XP, то вищий ваш Рівень.</p>
              <ul>
                <li><strong>Схвалені донати/допомога:</strong> Базова нагорода (зазвичай 100 XP), але адмін може збільшити її за особливо значний внесок.</li>
                <li><strong>Щоденні квести:</strong> В Центрі Нагород ви знайдете 3 випадкові завдання (донат, вхід, коментар). За їх виконання дають додатковий XP.</li>
                <li><strong>Стріки (Streaks):</strong> Заходьте в додаток кілька днів поспіль. Кожні 3, 7 або 30 днів ви отримуватимете великі бонуси XP.</li>
              </ul>
            </div>
            
            <div className="instruction-block">
              <h3>Рівні та Бейджі</h3>
              <p>Ваш рівень (від "Новобранець" до "Герой") показує ваш статус у системі. Також, за певні досягнення (перший донат, серія днів, досягнення рівня) ви автоматично отримуєте унікальні <strong>Бейджі</strong>, які будуть сяяти у вашому профілі.</p>
            </div>
          </div>
        );

      case 'shop':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon">🪙</span> Магазин та ImpactCoins</h2>
            <div className="instruction-block">
              <h3>Що таке ImpactCoins?</h3>
              <p>Це внутрішня валюта платформи. На відміну від XP, який залишається з вами назавжди і визначає рівень, ImpactCoins можна <strong>витрачати</strong>.</p>
              <p><strong>Курс:</strong> За кожні зароблені 10 XP ви автоматично отримуєте 1 ImpactCoin (наприклад, за схвалений донат на 100 XP ви отримаєте 10 монет).</p>
            </div>
            
            <div className="instruction-block">
              <h3>Impact Shop</h3>
              <p>В Магазині (Impact Shop) ви можете обміняти накопичені монети на реальні чи віртуальні винагороди:</p>
              <ul>
                <li><strong>Знижки від партнерів:</strong> Промокоди в улюблені заклади, магазини чи на послуги (наприклад, знижка на пальне чи каву).</li>
                <li><strong>Ексклюзивні Бейджі:</strong> Преміальні відзнаки, які неможливо отримати просто за квести.</li>
                <li><strong>Кастомізація профілю:</strong> Унікальні рамки та теми оформлення, які виділять вас у Таблиці Лідерів.</li>
              </ul>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="instruction-section">
            <h2><span className="tab-icon">🎨</span> Профіль та Кастомізація</h2>
            <div className="instruction-block">
              <h3>Ваш особистий кабінет</h3>
              <p>У вкладці "Профіль" ви можете побачити всю статистику своєї активності: загальну суму пожертв, кількість схвалених заявок та графік активності за останні півроку.</p>
            </div>
            
            <div className="instruction-block">
              <h3>Кастомізація (Стиль)</h3>
              <p>За допомогою товарів з Магазину ви можете змінювати вигляд свого профілю:</p>
              <ul>
                <li><strong>Рамки:</strong> Золоті, неонові чи вогняні рамки навколо вашого аватару. Вони відображаються всюди, включно з таблицями лідерів!</li>
                <li><strong>Теми фону:</strong> Змінюйте задній фон свого профілю на унікальні градієнти (Кіберпанк, Океан, Ліс тощо).</li>
                <li><strong>Іконки нікнейму:</strong> Додайте спеціальний значок поруч зі своїм іменем.</li>
              </ul>
            </div>
            
            <div className="pro-tip">
              <span className="pro-tip-icon">✨</span>
              <div className="pro-tip-content">
                <h4>Будьте унікальними</h4>
                <p>Придбані стилі завжди можна змінити або вимкнути в налаштуваннях профілю. Експериментуйте з комбінаціями!</p>
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
            
            <div className="dashboard-hero">
              <div className="hero-summary-card">
                <div>
                  <p className="small-title">База знань</p>
                  <h2>Інструкція Користувача</h2>
                  <p className="hero-description">Все, що потрібно знати про роботу ImpactPulse: від подачі заявок до обміну балів на реальні нагороди.</p>
                </div>
              </div>
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