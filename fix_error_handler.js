const fs = require('fs');  
let c = fs.readFileSync('D:/zapti/apps/api/src/middleware/errorHandler.ts', 'utf8');  
c = c.replace('import { PrismaClientKnownRequestError } from \"@prisma/client/runtime/library\";', 'import { PrismaClientKnownRequestError } from \"@prisma/client/runtime/library\";\nimport { config } from \"../config.js\";');  
c = c.replace('\nimport { config } from \"../config.js\";\n', '\n');  
fs.writeFileSync('D:/zapti/apps/api/src/middleware/errorHandler.ts', c);  
console.log('Fixed errorHandler.ts'); 
