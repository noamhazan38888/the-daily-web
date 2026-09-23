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
	│   ├── pageController.js
	│   ├── authController.js
	│   ├── publicController.js
	│   ├── reporterController.js
	│   ├── editorController.js
	│   └── userController.js
	├── routes/
	│   ├── pageRoutes.js
	│   ├── authRoutes.js
	│   ├── publicRoutes.js
	│   ├── reporterRoutes.js
	│   ├── editorRoutes.js
	│   └── userRoutes.js
	├── middleware/
	│   ├── auth.js            # requireAuth ו-requireRole
	│   └── errorHandler.js
	├── services/
	│   └── weather.js        # מזג אוויר ו-cache בזיכרון
	├── views/
	│   ├── login.ejs
	│   ├── partials/          # header, footer, sidebar, article ו-weather
	│   └── pages/             # feed, article, reporter, editor ו-error
	└── public/
		├── css/               # עיצוב רספונסיבי
		├── js/                # טפסים, פעולות צוות ו-weather
		└── images/            # תמונות סטטיות
```

התיקיות הריקות נשמרות ב-Git באמצעות קובצי `.gitkeep`.

## התקנה והפעלה

מתוך תיקיית הפרויקט:

```powershell
npm install
New-Item -ItemType File -Path .env
notepad .env
```

מלאו את `.env` בפרטי MongoDB ובסוד session לפני הפעלת השרת. הקובץ מקומי
ואסור להוסיף אותו ל-Git. צרו סוד מקומי עבור `SESSION_SECRET` באמצעות Node:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

הגדירו גם מיקום למזג האוויר (אפשר להשאיר את תל אביב כברירת מחדל):

```env
WEATHER_LOCATION_NAME=תל אביב
WEATHER_LATITUDE=32.0853
WEATHER_LONGITUDE=34.7818
```

לכל חבר צוות יש ליצור `.env` מקומי עם פרטי החיבור שלו. אין לשלוח סיסמאות או
מפתחות דרך Git.

### MongoDB מקומי

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/the-daily-web
SESSION_SECRET=paste-the-generated-random-value-here
SESSION_TTL_DAYS=7
WEATHER_LOCATION_NAME=תל אביב
WEATHER_LATITUDE=32.0853
WEATHER_LONGITUDE=34.7818
```

### MongoDB Atlas

שמרו ב-`MONGODB_URI` connection string מסוג `mongodb+srv` שקיבלתם מבעל
המסד. אל תכניסו את הסיסמה ל-README או ל-Git. אם בונים את הכתובת ידנית, ציינו
את שם מסד הנתונים בפרטי החיבור:

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

## עמודי EJS

- `GET /` מציג את הפיד הציבורי עם חיפוש, קטגוריה, מיון ודפדוף.
- `GET /articles/:id` מציג את גרסת `published` המלאה ב-HTML שנשלח מהשרת,
  כולל כותרת, כתב, קטגוריה, תאריך, תמונה ותוכן. הכותרת והתקציר נכללים גם
  במטא-דאטה של העמוד.
- `GET /login` מציג את טופס הכניסה. התחברות HTML מפנה ל-`/reporter` או
  ל-`/editor` לפי תפקיד המשתמש; נתיבי JSON של האימות נשארו זמינים.
- אזור הכתב: `/reporter`, `/reporter/articles/new`,
  `/reporter/articles/:id`.
- אזור העורך: `/editor`, `/editor/articles/:id`.
- טפסי הכתב והעורך שולחים בקשות JSON ל-API הקיים. הקוד בדפדפן מציג שגיאה
  ומשאיר את הטופס פתוח אם הבקשה נכשלת.
- CSS ו-JavaScript מוגשים מתוך `src/public`. הפריסה עוברת לעמודה אחת במסכים
  צרים.

## ווידג'ט מזג אוויר

השרת מבקש מ-Open-Meteo טמפרטורה וקוד מזג אוויר לפי הקואורדינטות ב-`.env`.
הבקשה הראשונה נשמרת בזיכרון התהליך לעשר דקות, ובקשות מקבילות חולקות אותה.
השרת לא מציג נתונים שזמן המדידה שלהם או זמן שליפתם ישנים מ-15 דקות. בכשל זמני
הוא משתמש בנתונים האחרונים אם הם עדיין צעירים מ-15 דקות; אחרת מוצגת הודעת
זמינות. הבקשה החיצונית מוגבלת לארבע שניות, ובכשל יש המתנה של דקה לפני ניסיון
חוזר. אין צורך במפתח API.

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

במודל קיימים שני שדות נפרדים, אך ה-query הציבורי הקיים דורש גם
`status: 'published'`. בקר הכתב משנה סטטוס של כתבה שפורסמה ל-`pending_review`
כאשר עורכים אותה, ולכן הגרסה שאושרה נעלמת זמנית מהעמודים הציבוריים. בעל
ה-backend צריך להתאים את תנאי השאילתה או את מעבר הסטטוס.

ל-API הקיים אין כרגע פעולה לשליחת טיוטה חדשה לאישור עורך. הטופס מאפשר לשמור
את הכתבה, והעורך יכול לעבוד עם פעולות האישור ובקשת התיקונים שה-backend תומך
בהן. הוספת שליחה לאישור ומעברי הסטטוס נשארה לאחריות מפתח ה-backend.

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

## בדיקה ידנית של ממשק האתר

1. פתחו את `http://localhost:3000/`. נסו לחפש כותרת שקיימת במסד וגם מילה
   שאינה קיימת, לסנן קטגוריה ולדפדף בין תוצאות.
2. פתחו כתבה שפורסמה ובחרו **View Page Source**. הכותרת והגוף צריכים להופיע
   בתגובת ה-HTML הראשונית.
3. פתחו `/login`, התחברו לחשבון כתב או עורך ובדקו שההפניה מגיעה לאזור המתאים.
4. בכתב בדקו יצירת טיוטה, שמירת עריכה והערת עורך. בעורך בדקו סקירת טיוטה,
   בקשת תיקונים ופרסום לפי הסטטוסים הנתמכים.
5. בדקו את הפיד, הכתבה והטפסים ברוחב שולחני, טאבלט וטלפון.
6. בדקו שהווידג'ט מציג מזג אוויר כשהשירות זמין, והודעת זמינות כשהוא לא זמין.
7. בדקו את `/api/public/articles` כדי לוודא שה-API עדיין מחזיר JSON.

ה-seed הנוכחי יוצר משתמשי demo בלבד. בדיקות ממשק התוכן צריכות כתבות במסד.

## מה מומש עד עכשיו

- שלד Express במבנה MVC
- חיבור Mongoose ל-MongoDB, כולל `mongodb+srv`
- מודלים לארבעת התחומים המרכזיים
- התחברות עם סיסמאות מוצפנות
- sessions שנשמרים במסד הנתונים
- הרשאות server-side לפי תפקיד
- CRUD בסיסי לכתבות, משתמשים, תגובות ונתוני צפייה
- pagination, חיפוש ומיון בסיסיים לפיד הציבורי
- עמודי EJS ציבוריים, אזורי כתב ועורך ועיצוב מותאם למסכים צרים
- ווידג'ט מזג אוויר עם cache של 10 דקות והגבלת גיל נתונים ל-15 דקות
- תיעוד מבנה הפרויקט והפעלה

## המשך עבודה

השלבים בצד backend שעדיין נדרשים כדי להשלים את האפיון:

- השלמת מעברי הכתבה עם בדיקת state machine מלאה
- הגבלת תגובות ל-3 בדקה לפי מכשיר
- ספירת צפייה אטומית ועדכון `ViewStats` בזמן צפייה
- גרסאות מלאות והשוואת תוכן לעורך
- AJAX, גלילה אינסופית ועדכון תגובות ללא רענון
- Chart.js עבור Impact Analytics
- seed מלא עם 500 כתבות, תגובות, עדכונים ונתוני צפייה