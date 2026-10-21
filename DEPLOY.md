# Deploy FocusForge as a free web link

Three free services: **Neon** (database), **Render** (backend), **Vercel** (the app). Do them in this order.
You need a free **GitHub** account to connect them.

## 0. Put the project on GitHub

1. Run `setup.cmd` in `mobile` once, so `mobile/package.json` lists all libraries.
2. Create a new empty repository on github.com (name it `focusforge`).
3. In the `focusforge` folder run:
   ```
   git init
   git add .
   git commit -m "FocusForge"
   git branch -M main
   git remote add origin https://github.com/YOUR-NAME/focusforge.git
   git push -u origin main
   ```
   (`backend/.env` is ignored by git, so your local password is not uploaded.)

## 1. Database - Neon

1. Sign up at neon.tech, create a project.
2. Copy the **connection string** (starts with `postgresql://`). Keep it for step 2.
3. Optional demo data: on your laptop, temporarily put that string in `backend/.env` as `DATABASE_URL`, run
   `npx prisma db push` and `npm run seed`, then change `.env` back to the local one.

## 2. Backend - Render

1. Sign up at render.com, click **New → Web Service**, connect your GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build && npx prisma db push`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. Environment variables:
   - `DATABASE_URL` = the Neon connection string
   - `JWT_SECRET` = any long random text
   - `NODE_VERSION` = `22`
4. Deploy. When it finishes, open `https://YOUR-SERVICE.onrender.com/health` - it should say `"status":"ok"`.
   The free plan sleeps when idle, so the first request after a while takes about a minute.

## 3. App - Vercel

1. Sign up at vercel.com, click **Add New → Project**, import the same repo.
2. Settings:
   - **Root Directory:** `mobile`
   - Framework Preset: **Other** (the build command and output folder come from `mobile/vercel.json`)
3. Environment variable: `EXPO_PUBLIC_API_URL` = `https://YOUR-SERVICE.onrender.com` (your Render address, no trailing slash).
4. Deploy. Vercel gives you a link like `https://focusforge.vercel.app` - that is your proof.

Open the link on a phone or laptop, sign up, and everything works. Wake the backend first by opening its `/health` page.
