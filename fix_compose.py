import re  
  
with open(r'D:\\zapti\\docker-compose.yml', 'r') as f:  
    content = f.read()  
  
content = content.replace('POSTGRES_USER: \n      POSTGRES_PASSWORD: \n      POSTGRES_DB: ', 'POSTGRES_USER: \n      POSTGRES_PASSWORD: \n      POSTGRES_DB: ')  
content = content.replace('test: [\" "\CMD-SHELL\\, \\pg_isready\" -U -d "\\]', 'test: [\CMD-SHELL\, \pg_isready" -U  -d "\]')  
content = content.replace('DATABASE_URL=postgresql://:@postgres:5432/?schema=public', 'DATABASE_URL=postgresql://:@postgres:5432/?schema=public')  
replacements = {  
    'JWT_SECRET=\n      - JWT_REFRESH_SECRET=': 'JWT_SECRET=\n      - JWT_REFRESH_SECRET=',  
    'ENCRYPTION_KEY=\n      - FRONTEND_URL=': 'ENCRYPTION_KEY=\n      - FRONTEND_URL=',  
    'SMTP_HOST=\n      - SMTP_PORT=': 'SMTP_HOST=\n      - SMTP_PORT=',  
    'SMTP_USER=\n      - SMTP_PASS=': 'SMTP_USER=\n      - SMTP_PASS=',  
    'EMAIL_FROM=\n      - WEBHOOK_SECRET=': 'EMAIL_FROM=\n      - WEBHOOK_SECRET=',  
    'EVOLUTION_API_URL=\n      - EVOLUTION_API_KEY=': 'EVOLUTION_API_URL=\n      - EVOLUTION_API_KEY=',  
    'MAX_FILE_SIZE=\n      - BACKUP_DIR=': 'MAX_FILE_SIZE=\n      - BACKUP_DIR=/data/zapti/backups',  
    'CORS_ORIGIN=\n      - LOG_LEVEL=': 'CORS_ORIGIN=\n      - LOG_LEVEL=',  
    'FEATURE_WEBSOCKET=\n      - FEATURE_SCHEDULER=': 'FEATURE_WEBSOCKET=\n      - FEATURE_SCHEDULER=',  
    'FEATURE_EMAIL=\n      - FEATURE_BACKUPS= ': 'FEATURE_EMAIL=\n      - FEATURE_BACKUPS=',  
    'REDIS_URL=redis://redis:6379\n      - JWT_SECRET=': 'REDIS_URL=redis://redis:6379\n      - JWT_SECRET=',  
}  
  
for old, new in replacements.items():  
    content = content.replace(old, new)  
  
with open(r'D:\\zapti\\docker-compose.yml', 'w') as f:  
    f.write(content)  
print('Fixed!')  
