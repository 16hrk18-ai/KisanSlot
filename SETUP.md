# Setting up KisanSlot (Firebase, free Spark plan)

Everything here uses Firebase's free "Spark" plan and free OpenStreetMap
map/geocoding services. No credit card or paid API key is needed.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click **Add project**, give it a name (e.g. `kisanslot`), and finish the wizard.
   You can leave Google Analytics off — it isn't used here.

## 2. Turn on Google sign-in

1. In the left sidebar, go to **Build → Authentication**.
2. Click **Get started**.
3. Under the **Sign-in method** tab, click **Google**, toggle it **Enable**,
   pick a support email, and **Save**.

## 3. Create the Firestore database

1. In the left sidebar, go to **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Start in production mode** (we'll paste in real rules next),
   pick a location close to your users, and click **Enable**.

## 4. Apply the security rules

1. Still in Firestore, open the **Rules** tab.
2. Delete the placeholder text and paste in the contents of `firestore.rules`
   from this project.
3. Click **Publish**.

These rules make sure: a farmer can only read/edit their own profile and
bookings; a centre can only manage its own schedules and see bookings made
against it; centre profiles and open schedules are publicly readable so
farmers can browse them before signing in as anything.

## 5. Register a web app and copy the config

1. In the Firebase console, click the gear icon → **Project settings**.
2. Scroll to **Your apps**, click the **</>** (web) icon.
3. Give it a nickname (e.g. `kisanslot-web`) and click **Register app**.
   You do *not* need Firebase Hosting for this step.
4. Firebase shows a `firebaseConfig` object. You'll need six values from it:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.

## 6. Fill in your local environment file

1. In the project folder, copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste in the six values from step 5, e.g.:
   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=kisanslot.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=kisanslot
   VITE_FIREBASE_STORAGE_BUCKET=kisanslot.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```
3. Never commit `.env` — it's already in `.gitignore`.

## 7. Run it locally

```
npm install
npm run dev
```

Open the printed `localhost` URL. `localhost` is authorized for Google
sign-in by default, so login should work immediately in development.

## 8. (When you deploy) authorize your real domain

Google sign-in only works from domains Firebase knows about.

1. Firebase console → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and add whatever domain you deploy to
   (e.g. `your-app.vercel.app`, `your-app.netlify.app`, or your own domain).
   `localhost` is already there by default.

Any static host works since this is a plain Vite build — Firebase Hosting's
free tier, Vercel, and Netlify are all fine. If you use Firebase Hosting:

```
npm install -g firebase-tools
firebase login
firebase init hosting   # point it at the "dist" folder, single-page app: yes
npm run build
firebase deploy
```

## About the location features

- **"Use my current location"** uses the browser's built-in Geolocation
  API — no key, no cost, but the user must grant permission and the site
  must be served over HTTPS (or `localhost`) for it to work.
- **Address lookup and search** use [Nominatim](https://nominatim.org),
  OpenStreetMap's free geocoding service. It's rate-limited for fair use,
  which is more than enough for this app's per-action lookups.
- **Map tiles** are OpenStreetMap's free tile server via Leaflet.

## Firestore free-tier limits (Spark plan)

The free plan gives you 50K document reads, 20K writes, and 20K deletes
per day, plus 1 GiB of stored data — enough for real testing and small-scale
pilot use. If you outgrow it, Firebase's next tier (Blaze) is pay-as-you-go,
not a forced upgrade cost.

## Data model reference

- `farmers/{uid}` — name, phone, village
- `centres/{uid}` — centreName, officerName, phone, address, lat, lng, cropQuotas (array)
- `schedules/{id}` — centreId, centreName, date, window, cropType, capacity, bookedCount, status
- `bookings/{id}` — farmerId/Name/Phone/Village, centreId/Name, scheduleId, date, window,
  cropType, quantity, status, reschedule, timeline (array of activity log entries)

Booking `status` values: `pending → approved → ready → completed`, with
`reschedule-proposed`, `declined`, `cancelled`, and `no-show` as branch points.
