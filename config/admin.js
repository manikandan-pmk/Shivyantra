module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'some-secret-key'),

    sessions: {
      maxSessionLifespan: env.int('ADMIN_SESSION_LIFESPAN', 60 * 60 * 1000),
      maxRefreshTokenLifespan: env.int('ADMIN_REFRESH_TOKEN_LIFESPAN', 7 * 24 * 60 * 60 * 1000), 
    },
  },

  apiToken: {
    salt: env('API_TOKEN_SALT', 'default-salt'),
  },

  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'transfer-salt'),
    },
  },

  secrets: {
    encryptionKey: env('ENCRYPTION_KEY', 'encryption-key'),
  },

  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
