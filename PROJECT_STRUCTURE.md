# Bustracking GR6 - Project Structure

## New Folder Organization

```
bustracking-gr6/
├── src/                           # Backend code
│   ├── server.js                  # Main Express server entry point
│   ├── db.js                      # MySQL connection pool
│   └── routes/                    # API route handlers
│       ├── parents.js
│       ├── students.js
│       ├── drivers.js
│       ├── buses.js
│       ├── routes.js
│       ├── stops.js
│       ├── schedules.js
│       ├── assignments.js
│       ├── positions.js
│       ├── messages.js
│       ├── pickup-records.js
│       ├── driver-reports.js
│       └── notifications.js
│
├── public/                        # Frontend - Static files served by Express
│   ├── index.html                 # Main dashboard
│   ├── login.html                 # Login page
│   ├── admin.html                 # Admin panel
│   ├── css/
│   │   └── style.css              # Frontend styling
│   └── js/
│       └── app.js                 # Frontend JavaScript
│
├── front-end/                     # Original frontend folder (deprecated, kept for backup)
│   └── [same files as public/]
│
├── ssb_backend/                   # Original backend folder (deprecated, kept for backup)
│   └── [legacy files]
│
├── .env                           # Environment variables (DB credentials, PORT)
├── .gitignore                     # Git ignore rules
├── package.json                   # NPM dependencies and scripts
├── package-lock.json              # Locked dependency versions
└── node_modules/                  # Installed packages

```

## Key Changes

### Backend Structure
- **Before**: Backend files were scattered in `ssb_backend/` folder
- **After**: All backend code in organized `src/` folder
  - Main server: `src/server.js` (previously `ssb_backend/server.js`)
  - Database: `src/db.js` (previously `ssb_backend/db.js`)
  - Routes: `src/routes/` (previously `ssb_backend/routes/`)

### Frontend Structure
- **Before**: Frontend files in `front-end/` folder
- **After**: Frontend files in `public/` folder (standard Express.js convention)
  - HTML: `public/*.html`
  - Styling: `public/css/style.css` (previously `ssb_backend/style.css`)
  - JavaScript: `public/js/app.js` (previously `ssb_backend/app.js`)

### Configuration
- **Before**: `.env` was in `ssb_backend/`
- **After**: `.env` moved to project root for easier access and deployment

### Server Entry Point
- **Before**: `node ssb_backend/server.js`
- **After**: `node src/server.js` or `npm start`

## Running the Server

### Method 1: Using npm start
```bash
npm start
```

### Method 2: Direct node command
```bash
node src/server.js
```

### From project root
```bash
cd /path/to/bustracking-gr6
npm start
```

## Import Paths

### Backend (No changes needed - already correct)
Route files still use: `const { pool } = require("../db");`
✓ This path works correctly from `src/routes/*.js` to `src/db.js`

### Frontend
HTML files now reference CSS correctly:
- `<link rel="stylesheet" href="css/style.css">` ✓

## Environment Variables (.env)

Located at project root: `bustracking-gr6/.env`

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=ssb_database
PORT=3000
```

## Static Files Serving

Express now serves static files from the `public/` directory:
- `src/server.js` line 14: `app.use(express.static(path.join(__dirname, "../public")))`
- Accessible at: `http://localhost:3000/`
- Files like `public/index.html` → `http://localhost:3000/index.html`
- CSS: `public/css/style.css` → `http://localhost:3000/css/style.css`
- JavaScript: `public/js/app.js` → `http://localhost:3000/js/app.js`

## Backward Compatibility

For reference and backup:
- Original backend files: `ssb_backend/` (can be deleted after verification)
- Original frontend files: `front-end/` (can be deleted after verification)

**These folders are NOT used by the running application.**

## API Endpoints

All API routes work as before:
- `/api/parents/list`
- `/api/students/list`
- `/api/drivers/list`
- `/api/buses/list`
- `/api/routes/list`
- `/api/stops/list`
- `/api/schedules/list`
- `/api/assignments/list`
- `/api/positions/list` and `/api/positions/bus/:bus_id`
- `/api/messages/list`
- `/api/pickup-records/list`
- `/api/driver-reports/list`
- `/api/notifications/list`

## Verification Checklist

- ✓ New directories created: `src/`, `public/`, `public/css/`, `public/js/`
- ✓ Backend files moved to `src/`
- ✓ Frontend files moved to `public/`
- ✓ CSS file moved to `public/css/`
- ✓ JavaScript file moved to `public/js/`
- ✓ `.env` file moved to project root
- ✓ HTML files updated with correct CSS paths
- ✓ server.js updated to serve static files from `public/`
- ✓ All route imports remain correct (`../db` paths)
- ✓ package.json updated with `start` script
- ✓ Server starts successfully with `npm start`

## Next Steps (Optional Cleanup)

When you're confident the new structure is working:
1. Delete `ssb_backend/` folder (backup first if needed)
2. Delete `front-end/` folder (backup first if needed)
3. Commit these changes to git
4. Update any deployment/build scripts to use `npm start`

## Troubleshooting

**Server won't start?**
- Check `.env` is in project root
- Run `npm install` to ensure dependencies are installed
- Verify MySQL connection settings in `.env`

**CSS/JS not loading?**
- Check paths in HTML files reference `css/style.css` and `js/app.js`
- Verify files exist in `public/css/` and `public/js/`
- Clear browser cache

**Routes not found?**
- Check `src/server.js` imports all 13 routes correctly
- Verify route files are in `src/routes/` directory
- Check browser console for actual errors
