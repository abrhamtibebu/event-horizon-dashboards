# Production Deployment Guide

This guide will help you deploy the Event Horizon Dashboards application to production.

## Quick Start

### 1. Environment Setup

Create a production environment file:
```bash
cp env.example .env.production
```

Edit `.env.production`:
```env
VITE_API_URL=http://localhost:8000/api
VITE_API_KEY=your-production-api-key
```

### 2. Build for Production

```bash
npm run build:prod
# or
bun run build:prod
```

The built files will be in the `dist/` directory.

## Deployment Options

### Option 1: Static Hosting (Recommended)

#### Netlify
1. Connect your repository to Netlify
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard:
   - `VITE_API_URL`: `http://localhost:8000/api`
   - `VITE_API_KEY`: Your production API key

#### Vercel
1. Connect your repository to Vercel
2. Set build command: `npm run build:prod`
3. Set output directory: `dist`
4. Add environment variables in Vercel dashboard

#### GitHub Pages
1. Build the project: `npm run build:prod`
2. Push the `dist/` folder to a `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Option 2: Docker Deployment

#### Build and Run Docker Container
```bash
# Build the Docker image
docker build -t event-horizon-dashboards .

# Run the container
docker run -p 80:80 event-horizon-dashboards
```

#### Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  event-dashboard:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://localhost:8000/api
```

Run with:
```bash
docker-compose up -d
```

### Option 3: Traditional Web Server

#### Nginx Setup
1. Build the project: `npm run build:prod`
2. Copy contents of `dist/` to `/var/www/html/`
3. Use the provided `nginx.conf` file
4. Restart nginx: `sudo systemctl restart nginx`

#### Apache Setup
1. Build the project: `npm run build:prod`
2. Copy contents of `dist/` to `/var/www/html/`
3. Create `.htaccess` file:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `http://localhost:8000/api` |
| `VITE_API_KEY` | API key for authentication | Yes | - |
| `VITE_EVELLA_URL` | Evella platform URL | No | `http://localhost:3000` |
| `VITE_PLATFORM_URL` | Platform URL | No | `http://localhost:5174` |

## SSL/HTTPS Setup

### Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate
1. Obtain SSL certificate from your provider
2. Update nginx configuration to include SSL
3. Redirect HTTP to HTTPS

## Monitoring and Logs

### Health Check
The application includes a health check endpoint at `/health`

### Logs
- Nginx access logs: `/var/log/nginx/access.log`
- Nginx error logs: `/var/log/nginx/error.log`
- Application logs: Check your hosting platform's log system

## Troubleshooting

### Common Issues

1. **404 errors on page refresh**
   - Ensure your server is configured for SPA routing
   - All routes should serve `index.html`

2. **API connection errors**
   - Verify `VITE_API_URL` is correct
   - Check CORS settings on your backend
   - Ensure API is accessible from your domain

3. **Image loading issues**
   - Verify storage URLs are accessible
   - Check if images are being served from correct domain

4. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run lint`

### Performance Optimization

1. **Enable gzip compression** (included in nginx.conf)
2. **Set proper cache headers** (included in nginx.conf)
3. **Use CDN for static assets** if needed
4. **Monitor bundle size** with `npm run build:prod -- --analyze`

## Security Considerations

1. **Environment variables** should never be committed to version control
2. **HTTPS** should be enabled in production
3. **Security headers** are included in the nginx configuration
4. **API keys** should be rotated regularly
5. **Regular updates** of dependencies and server software

## Support

For issues related to:
- **Frontend**: Check the application logs and browser console
- **Backend**: Contact your backend team or check API documentation
- **Deployment**: Refer to your hosting provider's documentation











