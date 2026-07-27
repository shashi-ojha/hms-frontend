# 🏥 MedCare — Patient Portal (Next.js)

A modern patient-facing frontend for the Hospital Management System
Spring Boot API — book appointments, view medical records, prescriptions
and bills.

## Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (custom design tokens — teal/amber/coral palette)
- Axios (with JWT interceptor)
- lucide-react icons

## 1. Install dependencies

```bash
npm install
```

## 2. Configure the API URL

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
# Local backend
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## 3. Run locally

```bash
npm run dev
```

Visit `http://localhost:3000`. Make sure your Spring Boot backend is
running on `http://localhost:8080` (or update the env var above).

## 4. Try it out

1. Go to `/register`, sign up as a patient.
2. **Important:** your `Patient` profile (medical details) is created
   by an ADMIN/RECEPTIONIST in the current backend — see note below.
3. Once your profile is linked, log in and you'll land on the dashboard.

## ⚠️ Backend note — patient self-service

The current `PatientController` only allows `ADMIN` / `RECEPTIONIST`
to create or update a `Patient` record:

```java
@PostMapping
@PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")
public ResponseEntity<PatientResponseDTO> createPatient(...) { ... }
```

That means a patient who just registered has a `User` account but no
linked `Patient` profile yet — the portal shows a friendly
"profile is being set up" screen in this case (see
`app/(portal)/layout.tsx`).

**To make this fully self-service**, consider adding to
`PatientController`:

```java
// Let a logged-in patient create their own profile once
@PostMapping("/me")
@PreAuthorize("hasRole('PATIENT')")
public ResponseEntity<PatientResponseDTO> createOwnProfile(
        @Valid @RequestBody PatientRequestDTO dto,
        Authentication authentication) {
    // look up the User by authentication.getName() (email),
    // force dto.userId to that user's id server-side,
    // then call the same service method used by ADMIN/RECEPTIONIST
}
```

and similarly allow `PATIENT` to `PUT` their *own* record. This is a
backend change — not required to demo the frontend, but worth doing if
you want genuine self-service onboarding.

## 5. Deploy to Vercel

1. Push this project to its own GitHub repo (e.g. `hms-frontend`).
2. Go to [vercel.com](https://vercel.com) → **New Project** → import
   the repo.
3. Framework preset: **Next.js** (auto-detected).
4. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com`
5. Deploy.

## ⚠️ CORS — required backend change

Your Spring Boot API needs to allow requests from your Vercel domain.
Add a CORS config bean (if you don't already have one):

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                    .allowedOrigins(
                        "http://localhost:3000",
                        "https://your-frontend.vercel.app"
                    )
                    .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

Without this, the deployed frontend's requests to Render will be
blocked by the browser with a CORS error.

## Project structure

```
app/
  login/              → sign in
  register/           → patient sign up
  (portal)/           → auth-guarded shell (sidebar + topbar)
    dashboard/         → stats + upcoming appointment tickets
    doctors/            → search & book doctors
    appointments/        → upcoming / past / cancelled tabs
    records/              → diagnosis + prescriptions timeline
    bills/                  → billing history & totals
    profile/                 → patient details (read-only)
components/           → shared UI (Sidebar, Topbar, cards, modal…)
lib/                   → api client, auth context, types, formatters
```