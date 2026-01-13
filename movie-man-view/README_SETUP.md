# Environment Variables Setup

Create a `.env` file in the `movie-man-view` directory with the following variables:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# TMDB API Key
REACT_APP_TMDB_API_KEY=your_tmdb_api_key
```

## How to Get These Values:

1. **Supabase URL & Key**: 
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" and "anon public" key

2. **TMDB API Key**:
   - Sign up at https://www.themoviedb.org/
   - Go to Settings → API
   - Request an API key (free)
   - Copy the API key

**Important**: Never commit the `.env` file to Git! It's already in `.gitignore`.
