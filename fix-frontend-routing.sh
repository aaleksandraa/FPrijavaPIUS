#!/bin/bash

# PIUS Academy - Frontend Routing Fix
# Fixes 404 errors on SPA routes like /admin

set -e

echo "🚀 PIUS Academy - Frontend Routing Fix"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (sudo)${NC}"
    exit 1
fi

NGINX_CONFIG="/etc/nginx/sites-available/prijava.pius-academy.com"
FRONTEND_DIR="/var/www/frontend"

echo -e "${BLUE}📋 Step 1: Check current setup${NC}"
echo ""

# Check if nginx config exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo -e "${RED}❌ Nginx config not found: $NGINX_CONFIG${NC}"
    echo "Creating new config..."
    
    cat > "$NGINX_CONFIG" <<'EOF'
server {
    listen 443 ssl http2;
    server_name prijava.pius-academy.com;
    
    root /var/www/frontend/dist;
    index index.html;
    
    ssl_certificate /etc/letsencrypt/live/prijava.pius-academy.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/prijava.pius-academy.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    access_log /var/log/nginx/prijava.pius-academy.com.access.log;
    error_log /var/log/nginx/prijava.pius-academy.com.error.log;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
    
    # SPA routing - KLJUČNA LINIJA
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

server {
    listen 80;
    server_name prijava.pius-academy.com;
    return 301 https://$server_name$request_uri;
}
EOF
    
    echo -e "${GREEN}✅ Config created${NC}"
else
    echo -e "${GREEN}✅ Config exists${NC}"
    
    # Backup existing config
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Backup created${NC}"
    
    # Check if try_files is correct
    if grep -q "try_files.*index.html" "$NGINX_CONFIG"; then
        echo -e "${GREEN}✅ SPA routing already configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Fixing SPA routing...${NC}"
        # Add or fix try_files directive
        sed -i 's|try_files.*|try_files $uri $uri/ /index.html;|g' "$NGINX_CONFIG"
        echo -e "${GREEN}✅ SPA routing fixed${NC}"
    fi
fi
echo ""

echo -e "${BLUE}📦 Step 2: Check frontend build${NC}"
if [ -f "$FRONTEND_DIR/dist/index.html" ]; then
    echo -e "${GREEN}✅ Frontend build exists${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not built, building now...${NC}"
    cd "$FRONTEND_DIR"
    npm run build
    echo -e "${GREEN}✅ Frontend built${NC}"
fi
echo ""

echo -e "${BLUE}🔐 Step 3: Set permissions${NC}"
chown -R www-data:www-data "$FRONTEND_DIR/dist"
chmod -R 755 "$FRONTEND_DIR/dist"
echo -e "${GREEN}✅ Permissions set${NC}"
echo ""

echo -e "${BLUE}🔗 Step 4: Enable site${NC}"
if [ ! -L "/etc/nginx/sites-enabled/prijava.pius-academy.com" ]; then
    ln -s "$NGINX_CONFIG" /etc/nginx/sites-enabled/
    echo -e "${GREEN}✅ Site enabled${NC}"
else
    echo -e "${GREEN}✅ Site already enabled${NC}"
fi
echo ""

echo -e "${BLUE}🧪 Step 5: Test Nginx config${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx config is valid${NC}"
else
    echo -e "${RED}❌ Nginx config has errors${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}🔄 Step 6: Reload Nginx${NC}"
systemctl reload nginx
echo -e "${GREEN}✅ Nginx reloaded${NC}"
echo ""

echo -e "${BLUE}🧪 Step 7: Testing${NC}"
echo ""

# Test root
echo "Test 1: Root path"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://prijava.pius-academy.com/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Root path works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Root path failed (HTTP $HTTP_CODE)${NC}"
fi

# Test /admin
echo "Test 2: /admin path"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://prijava.pius-academy.com/admin 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ /admin path works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ /admin path failed (HTTP $HTTP_CODE)${NC}"
fi

# Test /registracija
echo "Test 3: /registracija path"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://prijava.pius-academy.com/registracija 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ /registracija path works (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ /registracija path failed (HTTP $HTTP_CODE)${NC}"
fi
echo ""

echo "======================================"
echo -e "${GREEN}✨ Fix completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Open https://prijava.pius-academy.com/admin in browser"
echo "2. You should see the admin login page"
echo "3. No more 404 errors!"
echo ""
echo "If issues persist:"
echo "- Check Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- Check if index.html exists: ls -la $FRONTEND_DIR/dist/index.html"
echo "- Verify Nginx config: sudo nginx -t"
echo ""
