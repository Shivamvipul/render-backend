module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    ORGANIZER: 'organizer',
    PARTICIPANT: 'participant',
  },
  EVENT_STATUS: {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    CANCELLED: 'cancelled',
    PENDING_APPROVAL: 'pending_approval',
  },
  TICKET_TYPES: {
    FREE: 'free',
    PAID: 'paid',
    VIP: 'vip',
    EARLY_BIRD: 'early_bird',
  },
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  },
};
