module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
    sessions: {
      // New structure replacing 'options.expiresIn'
      maxSessionLifespan: env('ADMIN_SESSION_LIFESPAN', '1h'),
      maxRefreshTokenLifespan: env('ADMIN_REFRESH_TOKEN_LIFESPAN', '7d'),
    },
  },

  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },

  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },

  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'),
  },

  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
  },
});
