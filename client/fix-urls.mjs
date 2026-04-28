import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const files = [
    'src/pages/TasksPage.jsx',
    'src/pages/SupportPage.jsx',
    'src/pages/AdminDashboardPage.jsx',
    'src/pages/FundraisersPage.jsx',
    'src/pages/RewardsPage.jsx',
    'src/pages/ProfilePage.jsx',
    'src/pages/TaskDetailPage.jsx',
    'src/pages/MyContributionsPage.jsx',
    'src/pages/DashboardPage.jsx',
    'src/components/AdminUserList.jsx',
    'src/components/DashboardHeader.jsx',
    'src/components/SubmissionModal.jsx',
];

// Визначаємо відносний шлях до config/api.js залежно від папки файлу
function getImportPath(filePath) {
    if (filePath.startsWith('src/pages/')) return '../config/api.js';
    if (filePath.startsWith('src/components/')) return '../config/api.js';
    return '../../config/api.js';
}

let totalReplacements = 0;

for (const file of files) {
    const fullPath = resolve(file);
    let content;

    try {
        content = readFileSync(fullPath, 'utf-8');
    } catch {
        console.log(`⚠️  Не знайдено: ${file}`);
        continue;
    }

    const importLine = `import API_BASE_URL from '${getImportPath(file)}';\n`;

    // Замінюємо всі варіанти localhost URL
    let updated = content
        .replace(/['"`]http:\/\/localhost:5000\/([^'"`]*?)['"`]/g, '`${API_BASE_URL}/$1`')
        .replace(/['"`]http:\/\/localhost:5000['"`]/g, 'API_BASE_URL')
        .replace(/`http:\/\/localhost:5000\//g, '`${API_BASE_URL}/');

    const count = (content.match(/localhost:5000/g) || []).length;

    if (count === 0) {
        console.log(`✓  Пропущено (вже чисто): ${file}`);
        continue;
    }

    // Додаємо імпорт якщо його ще немає
    if (!updated.includes("from '../config/api.js'") && !updated.includes('from "../../config/api.js"')) {
        // Вставляємо після останнього import рядка
        const lastImportIndex = [...updated.matchAll(/^import .+$/gm)].pop();
        if (lastImportIndex) {
            const insertAt = lastImportIndex.index + lastImportIndex[0].length;
            updated = updated.slice(0, insertAt) + '\n' + importLine + updated.slice(insertAt);
        } else {
            updated = importLine + updated;
        }
    }

    writeFileSync(fullPath, updated, 'utf-8');
    totalReplacements += count;
    console.log(`✅ Виправлено ${count} URL в: ${file}`);
}

console.log(`\n🎉 Готово! Замінено ${totalReplacements} URL загалом.`);
console.log('Тепер запуши зміни в GitHub і Vercel перебілдить автоматично.');