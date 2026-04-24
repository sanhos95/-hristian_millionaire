# Біблійний квіз «Мільйонер»

Vue 3 + TypeScript + Vite. Гра працює в браузері та деплоїться на GitHub Pages.

## Вимоги
- Node.js **24+**
- npm (йде разом з Node)

## Запуск локально
```bash
npm ci
npm run dev
```

## Збірка (prod)
```bash
npm run build
npm run preview
```

## Скрипти для банку питань (опційно)
```bash
npm run refresh:ogienko-bank
```

## Деплой на GitHub Pages
1) Запуште в `main` (деплой запускається автоматично).
2) У репозиторії відкрийте `Settings → Pages` і виберіть **GitHub Actions**.
3) Дочекайтесь завершення workflow **Deploy to GitHub Pages** у вкладці `Actions`.

## Превʼю для месенджерів
Картинка OG превʼю лежить у `public/images/preview.jpg` і підтягується з `index.html` через `og:image`.
