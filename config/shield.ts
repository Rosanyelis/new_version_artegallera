import { defineConfig } from '@adonisjs/shield'

/**
 * Security configuration using Shield.
 * Provides protection against common web vulnerabilities like CSRF,
 * XSS, clickjacking, and other security threats.
 */
const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    /**
     * Enable Content Security Policy headers.
     * CSP helps prevent XSS attacks by controlling which resources can be loaded.
     */
    enabled: true,

    /**
     * CSP directives define the allowed sources for different resource types.
     * Example: { defaultSrc: ["'self'"], scriptSrc: ["'self'", "'unsafe-inline'"] }
     */
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:', 'http://localhost:8888'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'http://localhost:8888'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },

    /**
     * When true, CSP violations are reported but not enforced.
     * Useful for testing CSP policies before enforcing them.
     */
    reportOnly: true,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    /**
     * Enable CSRF protection.
     * Protects against Cross-Site Request Forgery attacks.
     */
    enabled: true,

    /**
     * Routes that should be excluded from CSRF protection.
     * Useful for webhooks or API endpoints that use other auth methods.
     */
    // The same-origin React client uses the session cookie and will receive
    // API-specific auth errors instead of an HTML redirect.
    exceptRoutes: [
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/logout',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/events/:eventId/rounds/:roundId/bets',
      '/api/v1/admin/rounds/:roundId/settle',
      '/api/v1/events/:eventId/chat',
    ],

    /**
     * Enable XSRF-TOKEN cookie for JavaScript frameworks.
     * When enabled, the CSRF token is available to client-side code.
     */
    enableXsrfCookie: true,

    /**
     * HTTP methods that require CSRF token validation.
     * GET, HEAD, and OPTIONS are safe methods and don't need protection.
     */
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    /**
     * Enable X-Frame-Options header.
     * Helps prevent clickjacking attacks.
     */
    enabled: true,

    /**
     * Frame embedding policy.
     * It can block all framing with 'DENY' or allow same-origin framing
     * with 'SAMEORIGIN'.
     */
    action: 'DENY',
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    /**
     * Enable HTTP Strict Transport Security.
     * Tells browsers to always use HTTPS for this site.
     */
    enabled: true,

    /**
     * How long browsers should remember to use HTTPS.
     * After this period, browsers may try HTTP again.
     */
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    /**
     * Enable X-Content-Type-Options: nosniff header.
     * Prevents MIME type sniffing which can lead to security vulnerabilities.
     */
    enabled: true,
  },
})

export default shieldConfig
