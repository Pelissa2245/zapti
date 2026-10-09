import { FastifyPluginAsync } from 'fastify';
import { config } from '@zapti/shared/config';

const multipartPlugin: FastifyPluginAsync = async (app) => {
  const cfg = config();

  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: cfg.maxFileSize || 10 * 1024 * 1024, // 10MB default
      files: 5,
    },
    attachFieldsToBody: true,
  });
};

export default multipartPlugin;