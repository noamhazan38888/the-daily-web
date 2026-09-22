# The Daily Web

שרת עבור מערכת החדשות, המבוסס על Node.js, Express, MongoDB, Mongoose ו-EJS.
הפרויקט משתמש במבנה MVC ומפריד בין מודלים, controllers, routes, middleware ותצוגות.

## טכנולוגיות

- Node.js עם ES Modules
- Express 5
- MongoDB עם Mongoose
- EJS לתצוגות server-side
- `express-session` עם `connect-mongo` לשמירת sessions במסד הנתונים
- `bcryptjs` להצפנת סיסמאות
- `helmet` לאבטחת HTTP headers
- `morgan` ללוגים של בקשות HTTP

## היררכיית הפרויקט

```text
the-daily-web/
├── .env.example              # תבנית משתני סביבה
├── .gitignore
├── package.json              # scripts ותלויות
├── package-lock.json
├── README.md
└── src/
	├── app.js                # יצירת אפליקציית Express וחיבור routes
	├── server.js             # חיבור למסד והפעלת HTTP server
	├── seed.js               # יצירת משתמשי demo
	├── config/
	│   ├── database.js       # חיבור וניתוק מ-MongoDB
	│   ├── env.js            # טעינת ואימות משתני סביבה
	│   └── session.js        # הגדרת session store ב-MongoDB
	├── models/
	│   ├── User.js           # משתמשים ותפקידים
	│   ├── Article.js        # כתבות, טיוטה וגרסה מפורסמת
	│   ├── Comment.js        # תגובות משתמשים ואורחים
	│   └── ViewStats.js      # צפיות לפי כתבה וזמן
	├── controllers/
	│   ├── authController.js
	│   ├── publicController.js
	│   ├── reporterController.js
	│   ├── editorController.js
	│   └── userController.js
	├── routes/
	│   ├── authRoutes.js
	│   ├── publicRoutes.js
	│   ├── reporterRoutes.js
	│   ├── editorRoutes.js
	│   └── userRoutes.js
	├── middleware/
	│   ├── auth.js            # requireAuth ו-requireRole
	│   └── errorHandler.js
	├── views/
	│   ├── login.ejs
	│   ├── partials/          # מיועד ל-header, footer ו-sidebar
	│   └── pages/             # מיועד לעמודי המערכת
	└── public/
		├── css/               # קבצי CSS
		├── js/                # JavaScript בדפדפן
		└── images/            # תמונות סטטיות
```

התיקיות הריקות נשמרות ב-Git באמצעות קובצי `.gitkeep`.

## התקנה והפעלה

מתוך תיקיית הפרויקט:

```powershell
npm install
Copy-Item .env.example .env
```

יש לערוך את `.env` לפני הפעלת השרת.

### MongoDB מקומי

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/the-daily-web
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_TTL_DAYS=7
```

### MongoDB Atlas

אפשר להשתמש ב-connection string מסוג `mongodb+srv` ללא שינוי בקוד:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/the-daily-web?retryWrites=true&w=majority
```

ב-Atlas יש להגדיר Database User ולהוסיף את כתובת ה-IP ב-Network Access.
אם הסיסמה כוללת תווים מיוחדים, יש לבצע להם URL encoding.

### הרצת השרת

```powershell
npm run dev
```

השרת יעלה בכתובת `http://localhost:3000`.

פקודות נוספות:

```powershell
npm start       # הרצה רגילה
npm run seed    # יצירת משתמשי demo במסד
```

## משתמשי demo

לאחר חיבור תקין ל-MongoDB:

```powershell
npm run seed
```

הפקודה יוצרת או מעדכנת:

| תפקיד | Username | Password |
|---|---|---|
| כתב | `reporter.demo` | `Reporter123!` |
| עורך | `editor.demo` | `Editor123!` |

אין להשתמש בסיסמאות האלה בסביבת production.

## API קיים

### בדיקת שרת

```text
GET /health
```

### Authentication

```text
GET  /api/auth/login
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

ה-session נשמר ב-MongoDB, ולכן משתמש מחובר יכול להמשיך לאחר Restart של השרת, כל עוד ה-session עדיין בתוקף.

### API ציבורי

```text
GET  /api/public/articles
GET  /api/public/articles/:id
GET  /api/public/articles/:id/comments
POST /api/public/articles/:id/comments
```

`GET /api/public/articles` תומך ב:

- `page` ו-`limit` ל-pagination
- `search` לחיפוש בכותרת
- `category` לסינון קטגוריה
- `sort=popular` למיון לפי צפיות

### API כתב

כל הנתיבים דורשים session של משתמש עם role `reporter`:

```text
GET    /api/reporter/articles
POST   /api/reporter/articles
GET    /api/reporter/articles/:id
PATCH  /api/reporter/articles/:id
DELETE /api/reporter/articles/:id
```

כתב יכול לגשת רק לכתבות שלו. מחיקת כתבה מפורסמת חסומה.

### API עורך

כל הנתיבים דורשים session של משתמש עם role `editor`:

```text
GET    /api/editor/articles
GET    /api/editor/articles/:id
PATCH  /api/editor/articles/:id
POST   /api/editor/articles/:id/publish
POST   /api/editor/articles/:id/request-changes
DELETE /api/editor/articles/:id
GET    /api/editor/articles/:id/view-stats
POST   /api/editor/articles/:id/view-stats
PATCH  /api/editor/articles/:id/view-stats/:statId
DELETE /api/editor/articles/:id/view-stats/:statId
PATCH  /api/editor/comments/:commentId
DELETE /api/editor/comments/:commentId
```

### ניהול משתמשים

CRUD משתמשים זמין לעורך בלבד:

```text
GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id
```

## סטטוסים של כתבה

```text
draft              בהכנה
pending_review     ממתינה לאישור עורך
published          פורסמה
changes_requested  הוחזרה לתיקונים
```

במודל `Article` נשמרים בנפרד:

- `draft` - התוכן שעליו עובדים כרגע
- `published` - הגרסה האחרונה שאושרה ומוצגת לציבור
- `publicationEvents` - היסטוריית פרסומים לצורך Analytics

כך עריכת כתבה מפורסמת אינה משנה מיד את התוכן שהציבור רואה.

## בדיקות ואימות

בדיקת syntax לכל קבצי ה-JavaScript:

```powershell
Get-ChildItem -Path src -Filter *.js -Recurse | ForEach-Object { node --check $_.FullName }
```

בדיקה מהירה של השרת:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

תוצאה צפויה:

```json
{"status":"ok"}
```

## מה מומש עד עכשיו

- שלד Express במבנה MVC
- חיבור Mongoose ל-MongoDB, כולל `mongodb+srv`
- מודלים לארבעת התחומים המרכזיים
- התחברות עם סיסמאות מוצפנות
- sessions שנשמרים במסד הנתונים
- הרשאות server-side לפי תפקיד
- CRUD בסיסי לכתבות, משתמשים, תגובות ונתוני צפייה
- pagination, חיפוש ומיון בסיסיים לפיד הציבורי
- תיעוד מבנה הפרויקט והפעלה

## המשך עבודה

השלבים שעדיין נדרשים כדי להשלים את האפיון:

- השלמת מעברי הכתבה עם בדיקת state machine מלאה
- הגבלת תגובות ל-3 בדקה לפי מכשיר
- ספירת צפייה אטומית ועדכון `ViewStats` בזמן צפייה
- גרסאות מלאות והשוואת תוכן לעורך
- EJS לעמודי הפיד, הכתבה, אזור הכתב ואזור העורך
- AJAX, גלילה אינסופית ועדכון תגובות ללא רענון
- Chart.js עבור Impact Analytics
- ווידג'ט מזג אוויר עם cache של עד 15 דקות
- seed מלא עם 500 כתבות, תגובות, עדכונים ונתוני צפייה