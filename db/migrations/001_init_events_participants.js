/* eslint-disable camelcase */
/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  // Events table
  pgm.createTable('events', {
    id: 'id', // serial primary key
    event_name: { type: 'varchar(100)', notNull: true },
    event_time: { type: 'timestamp', notNull: true },
    event_description: { type: 'varchar(500)' },
    route: { type: 'varchar(200)' },
    event_start: { type: 'varchar(100)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Participants table
  pgm.createTable('participants', {
    id: 'id', // serial primary key
    name: { type: 'varchar(100)', notNull: true },
    country: { type: 'varchar(30)' },
    club: { type: 'varchar(100)' },
    starting_number: { type: 'integer', notNull: true },
    email: { type: 'varchar(50)', notNull: true },
    phone: { type: 'varchar(20)' },
    event_id: { type: 'integer' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // starting_number auto-increment per event: use sequence per event via generated identity fallback
  // For MVP, enforce uniqueness per event so numbers are not duplicated.
  pgm.addConstraint('participants', 'participants_event_starting_number_unique', {
    unique: ['event_id', 'starting_number'],
  });

  // Unique registration per event by email
  pgm.addConstraint('participants', 'participants_event_email_unique', {
    unique: ['event_id', 'email'],
  });

  // FK from participants to events
  pgm.addConstraint('participants', 'participants_event_fk', {
    foreignKeys: [
      {
        columns: 'event_id',
        references: 'events(id)',
        onDelete: 'cascade',
      },
    ],
  });

  // Indexes
  pgm.createIndex('participants', ['event_id']);
  pgm.createIndex('events', ['event_time']);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('participants');
  pgm.dropTable('events');
};

