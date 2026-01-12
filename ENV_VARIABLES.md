# Environment Variables for Render Deployment

When deploying to Render, you'll need to add these environment variables in the Render Dashboard.

## Server Environment Variables

Add these in the Render Dashboard for the `cineverse-server` service:

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `MONGO_URI` | MongoDB connection string | Your MongoDB Atlas cluster |
| `JWT_SECRET` | Secret key for JWT tokens | Generate a random 32+ character string |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console |
| `TMDB_API_KEY` | TMDB API key | https://www.themoviedb.org/settings/api |
| `GEMINI_API_KEY` | Google Gemini API key | Google AI Studio |
| `OPENAI_API_KEY` | OpenAI API key (optional) | OpenAI Platform |
| `WATCHMODE_API_KEY` | WatchMode API key (optional) | WatchMode API |
| `TRAKT_CLIENT_ID` | Trakt Client ID (optional) | Trakt API |
| `TRAKT_CLIENT_SECRET` | Trakt Client Secret (optional) | Trakt API |
| `OMDB_API_KEY` | OMDB API key (optional) | OMDB API |

> [!IMPORTANT]
> **Never commit these values to Git!** They should only be entered in the Render Dashboard.

## Client Environment Variables

The client only needs:

| Variable Name | Value |
|--------------|-------|
| `VITE_SERVER_URL` | `https://cineverse-server.onrender.com` |

This is already set in `render.yaml`.

## How to Add Environment Variables in Render

1. Go to your Render Dashboard
2. Click on the `cineverse-server` service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Enter the key and value
6. Click **Save Changes**

Render will automatically redeploy when you add/update environment variables.

## Security Best Practices

- ✅ Use strong, random values for `JWT_SECRET`
- ✅ Rotate API keys periodically
- ✅ Never share API keys publicly
- ✅ Use environment-specific values (dev vs production)
- ❌ Never commit `.env` files to Git
- ❌ Never hardcode secrets in code
