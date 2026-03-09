# Local testing (before deploy)

Test the inquiry flow on your machine: website form → backend → admin dashboard.

## 1. Start the backend

```bash
cd backend
npm install
npm run seed:admin    # creates admin user (username: admin, password: password123) if not exists
npm run dev
```

Backend runs at **http://localhost:5001**. Leave this terminal open.

## 2. Start the website (public site)

Open a **new terminal**:

```bash
cd website
npm install
npm run dev
```

Website runs at **http://localhost:5173**. It already uses `http://localhost:5001` for API when on localhost.

## 3. Start the admin dashboard

Open another **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Admin runs at **http://localhost:5174**. It already uses `http://localhost:5001/api` when on localhost.

## 4. Test the inquiry flow

1. **Website:** Open http://localhost:5173  
   - The inquiry popup may appear (first visit).  
   - Or click any property card → popup opens.

2. **Submit the form:**  
   - Name (required), Mobile (required), Email, Message.  
   - Click **Submit**.

3. **Admin:** Open http://localhost:5174  
   - Log in: **username** `admin`, **password** `password123`  
   - Go to **Inquiries** (or http://localhost:5174/inquiries).  
   - Your submitted inquiry should appear.

## 5. Optional: fresh DB

If you want a clean SQLite DB and admin user only:

```bash
cd backend
rm -f database.sqlite
npm run dev
# Wait for "Database synced", then Ctrl+C and run:
npm run seed:admin
npm run dev
```

To also seed properties:

```bash
cd backend
npm run db:reset   # deletes DB, migrates, seeds all properties (no admin – run seed:admin after)
npm run seed:admin
npm run dev
```

## Ports

| App    | URL                    |
|--------|------------------------|
| Backend | http://localhost:5001 |
| Website | http://localhost:5173 |
| Admin   | http://localhost:5174 |

After this works locally, you can deploy with confidence.
