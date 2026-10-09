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
- `Chart.js` (נטען מ-CDN, אין build step) להצגת גרף Impact Analytics לעורך
- `@faker-js/faker` ליצירת נתוני seed מדומים ריאליסטיים

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
	├── seed.js               # משתמשי demo + 500 כתבות, תגובות ונתוני צפייה
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
	│   └── pages/             # feed, article, reporter, editor, אנליטיקס ו-error
	└── public/
		├── css/               # עיצוב רספונסיבי
		├── js/                # טפסים, שמירה אוטומטית לכתב, פיד, תגובות ו-weather
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
npm run seed    # משתמשי demo + 500 כתבות, תגובות ונתוני צפייה (מוחק תוכן קיים)
```

## Seed: משתמשים ותוכן מדומה

לאחר חיבור תקין ל-MongoDB:

```powershell
npm run seed
```

הפקודה יוצרת או מעדכנת 5 משתמשי כתב ו-2 משתמשי עורך (lazy upsert, לא נמחקים
בהרצות חוזרות):

| תפקיד | Username | Password |
|---|---|---|
| כתב | `reporter.demo` | `Reporter123!` |
| עורך | `editor.demo` | `Editor123!` |
| כתב | `reporter.1` | `Reporter123!` |
| כתב | `reporter.2` | `Reporter223!` |
| כתב | `reporter.3` | `Reporter323!` |
| כתב | `reporter.4` | `Reporter423!` |
| עורך | `editor.senior` | `EditorSenior23!` |

אין להשתמש בסיסמאות האלה בסביבת production.

בנוסף, כל הרצה **מוחקת** את כל הכתבות, התגובות ונתוני הצפייה הקיימים
(המשתמשים נשארים) ויוצרת מחדש:

- 500 כתבות, מפוזרות על פני כל הסטטוסים: 90 `draft`, 80 `pending_review`,
  50 `changes_requested`, 280 `published` — כולל כתבות שפורסמו ואז עודכנו
  (היסטוריית `publicationEvents` עם כמה גרסאות) לבדיקת ה-Impact Analytics
- כ-1,100–1,200 תגובות (אורחים ומשתמשים מחוברים) על הכתבות המפורסמות
- נתוני `ViewStats` יומיים לכל כתבה מפורסמת, בהתאם לגרסה שהייתה חיה בכל תאריך,
  ו-`Article.viewCount` מסונכרן לסכום הצפיות

כדי לשמר תוכן קיים שנוצר ידנית, אין להריץ `npm run seed` בסביבת production.

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
POST   /api/reporter/articles/:id/submit
DELETE /api/reporter/articles/:id
```

- כתב יכול לגשת רק לכתבות שלו (כתבה של כתב אחר מחזירה 404).
- `POST` ו-`PATCH` מקבלים רק את שדות התוכן (`title`, `summary`, `body`,
  `imageUrl`, `category`). אי אפשר לשנות דרכם סטטוס, בעלות או גרסה מפורסמת.
- `PATCH` מקבל גם תוכן חלקי, כי השמירה האוטומטית שולחת טיוטה שעדיין לא הושלמה.
  עריכה של כתבה שממתינה לאישור עורך מחזירה 409.
- `submit` מעביר כתבה מ-`draft` או `changes_requested` ל-`pending_review`,
  רק אם הכותרת, התקציר, הקטגוריה והתוכן מלאים. אחרת מוחזר 400 עם רשימת השדות.
- כתב לא יכול למחוק כתבה שמוצגת באתר או שממתינה לאישור; זו פעולה של עורך.

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
- אזור העורך: `/editor` (עם סינון סטטוס, כולל כפתורי אישור/החזרה לתיקון מהרשימה
  לכתבות `pending_review`), `/editor/articles/:id`,
  `/editor/articles/:id/analytics` (גרף Chart.js של צפיות לאורך זמן, עם סימון
  מועדי עדכון ופרסום מחדש).
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

`status` מתאר את מצב הגרסה שעליה עובדים (`draft`). כתבה מוצגת לציבור כל עוד
יש לה גרסה מאושרת (`published` אינו `null`), ללא קשר לסטטוס. התנאי מוגדר במקום
אחד: `PUBLIC_ARTICLE_FILTER` ב-`models/Article.js`.

### מעברים מותרים

```text
(כתבה חדשה)                     -> draft              כתב
draft / changes_requested       -> pending_review     כתב (submit)
pending_review                  -> published          עורך (publish)
pending_review                  -> changes_requested  עורך, עם הערה
published (הכתב עורך את התוכן)   -> draft              כתב; הגרסה המאושרת נשארת באתר
```

כל השמירות של הכתב עוברות דרך השרת, ולכן הכללים נאכפים גם אם עוקפים את הממשק.

### עריכת כתבה שכבר פורסמה

כשכתב משנה כתבה שפורסמה, השינוי נשמר ב-`draft` והסטטוס עובר ל-`draft`.
`published` לא משתנה, ולכן הקוראים, הפיד והתגובות ממשיכים לעבוד מול הגרסה
שאושרה. גם אחרי שליחה לאישור הגרסה הישנה נשארת באתר, ורק `publish` של עורך
מעתיק את הטיוטה ל-`published`. אם הכתב מחזיר את התוכן בדיוק לגרסה המפורסמת,
הסטטוס חוזר ל-`published`.

### שמירה אוטומטית (`public/js/reporter-editor.js`)

- הטופס נשמר בשרת כ-1.5 שניות אחרי הפסקת הקלדה. השמירות רצות אחת אחרי השנייה.
- השמירה הראשונה של כתבה חדשה יוצרת אותה ומעדכנת את הכתובת ל-`/reporter/articles/:id`.
  פתיחת "כתבה חדשה" בלי להקליד לא יוצרת כתבה ריקה.
- בסגירת לשונית או מעבר ממנה נשלחים שינויים שלא נשמרו עם `fetch(..., { keepalive: true })`.
- עותק גיבוי נשמר ב-`localStorage`. אם השרת לא היה זמין, השינויים משוחזרים
  ונשמרים בכניסה הבאה. הגיבוי משמש רק אם הכתבה לא השתנתה בשרת מאז (לפי
  `updatedAt`), כך שעבודה ממחשב אחר תמיד גוברת.
- בשגיאת רשת או 5xx יש ניסיון חוזר אחרי 5 שניות. שגיאות אחרות מוצגות למשתמש.
- כתבה שממתינה לאישור מוצגת לקריאה בלבד.

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
4. בכתב פתחו "כתבה חדשה" והקלידו כותרת. אחרי כשתי שניות מופיע "נשמר אוטומטית"
   והכתובת משתנה. רעננו, סגרו את הדפדפן או התחברו מדפדפן אחר: התוכן נשמר.
   נסו לשלוח כתבה חסרה (מוצגת הודעה), ואחר כך שלחו כתבה מלאה לאישור. היא
   הופכת לקריאה בלבד. בעורך בדקו סקירה, בקשת תיקונים עם הערה ופרסום.
5. ערכו ככתב כתבה שפורסמה ופתחו אותה בחלון גלישה בסתר: מוצגת עדיין הגרסה
   שאושרה. רק אחרי שליחה לאישור ופרסום של עורך מופיע התוכן החדש.
6. בדקו את הפיד, הכתבה והטפסים ברוחב שולחני, טאבלט וטלפון.
7. בדקו שהווידג'ט מציג מזג אוויר כשהשירות זמין, והודעת זמינות כשהוא לא זמין.
8. בדקו את `/api/public/articles` כדי לוודא שה-API עדיין מחזיר JSON.
9. התחברו כ-`editor.demo` ופתחו `/editor?status=pending_review`. אשרו כתבה
   אחת והחזירו כתבה אחרת לתיקון עם הערה; הרשימה מתעדכנת והסטטוס משתנה
   בלי לפתוח את הכתבה בנפרד.
10. פתחו כתבה מפורסמת (רצוי אחת שעודכנה כמה פעמים) ולחצו על "ניתוח צפיות".
    הגרף מציג צפיות לפי תאריך, עם משולשים אדומים על מועדי פרסום מחדש; מעבר
    עכבר על משולש מציג את מספר הגרסה והתאריך.

`npm run seed` מאכלס את המסד במשתמשים, 500 כתבות, תגובות ונתוני צפייה, כך
שאפשר לבדוק את כל התרחישים האלה בלי תוכן שנוצר ידנית.

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
- אזור כתב: שמירה אוטומטית לשרת עם גיבוי מקומי, שליחה לאישור עורך ואכיפת
  מעברי הסטטוס של הכתב בשרת
- עריכת כתבה שפורסמה בלי להסתיר את הגרסה המאושרת מהקוראים
- תיעוד מבנה הפרויקט והפעלה
- seed מלא: 500 כתבות על פני כל הסטטוסים, תגובות ונתוני `ViewStats`, בנוסף
  למשתמשי demo
- אזור העורך: כפתורי אישור והחזרה לתיקון מהירים ישירות מרשימת הכתבות
  הממתינות, בלי לפתוח כל כתבה בנפרד
- Impact Analytics: גרף Chart.js לצפיות לאורך זמן עם סימון מועדי עדכון
  ופרסום מחדש (`/editor/articles/:id/analytics`)

## המשך עבודה

השלבים בצד backend שעדיין נדרשים כדי להשלים את האפיון:

- אכיפת מעברי הסטטוס בצד העורך (למשל `request-changes` רק מ-`pending_review`)
- הגבלת תגובות ל-3 בדקה לפי מכשיר
- ספירת צפייה אטומית ועדכון `ViewStats` בזמן צפייה
- גרסאות מלאות והשוואת תוכן לעורך
- AJAX, גלילה אינסופית ועדכון תגובות ללא רענון