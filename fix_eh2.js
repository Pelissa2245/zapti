const fs=require('fs');  
const c = fs.readFileSync('D:/zapti/apps/api/src/middleware/errorHandler.ts', 'utf8');  
const lines = c.split('\n');  
let newLines = [];  
