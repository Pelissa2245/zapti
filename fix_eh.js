const fs = require('fs');  
const content = require('fs').readFileSync('D:/zapti/apps/api/src/middleware/errorHandler.ts', 'utf8');  
const newContent = content.replace('import { PrismaClientKnownRequestError } from \"@prisma/client/runtime/library\";', 'import { PrismaClientKnownRequestError } from \"@prisma/client/runtime/library\";\nimport { config } from \"../config.js\";').replace('\nimport { config } from \"../config.js\";\n', '\n');  
fs.writeFileSync('D:/zapti/apps/api/src/middleware/errorHandler.ts', newContent);  
console.log('Fixed'); 
