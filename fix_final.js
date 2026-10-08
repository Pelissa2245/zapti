const fs=require('fs');  
const content = \`// ZapTI API - Error Handler Middleware  
import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';  
import { ZodError } from 'zod';  
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';  
import { config } from '../config.js';  
ECHO is on.
export function setupErrorHandler(app: FastifyInstance) {  
  // Global error handler  
  app.setErrorHandler(async (error: FastifyError, request: FastifyRequest, reply: FastifyReply) = 
    // Log error  
    request.log.error({ err: error, url: request.url, method: request.method }, 'Request error');  
    // Zod validation errors  
    if (error instanceof ZodError) {  
      const issues = error.issues.map((issue) = 
        field: issue.path.join('.'),  
        message: issue.message,  
        code: issue.code,  
      }));  
      return reply.status(400).send({  
        error: {  
          code: 'VALIDATION_ERROR',  
          message: 'Dados de entrada inv lidos',  
          issues,  
        },  
      });  
    }  
    // Prisma errors  
    if (error instanceof PrismaClientKnownRequestError) {  
      switch (error.code) {  
        case 'P2002': // Unique constraint violation  
          {  
