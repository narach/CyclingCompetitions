/* eslint-disable camelcase */
/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('event_registrations', {
    id: 'id',
    event_id: { type: 'integer', notNull: true },
    name: { type: 'varchar(50)', notNull: true },
    surname: { type: 'varchar(80)', notNull: true },
    email: { type: 'varchar(100)', notNull: true },
    phone: { type: 'varchar(25)' },
    gender: { type: 'varchar(10)' },
    birth_year: { type: 'integer' },
    club: { type: 'varchar(100)' },
    country: { type: 'varchar(50)' },
    city: { type: 'varchar(50)' },
    start_number: { type: 'serial' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('event_registrations', 'event_registrations_event_fk', {
    foreignKeys: [
      {
        columns: 'event_id',
        references: 'events(id)',
        onDelete: 'cascade',
      },
    ],
  });

  pgm.createIndex('event_registrations', ['event_id']);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('event_registrations');
};


