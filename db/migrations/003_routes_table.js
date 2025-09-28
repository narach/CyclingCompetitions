/* eslint-disable camelcase */
/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  pgm.createTable('routes', {
    id: 'id', // serial primary key
    route_name: { type: 'varchar(200)', notNull: true },
    distance_m: { type: 'integer', notNull: true },
    ascent_m: { type: 'integer', notNull: true },
    descent_m: { type: 'integer', notNull: true },
    event_id: { type: 'integer' },
    route_url: { type: 'varchar(500)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('routes', 'routes_event_fk', {
    foreignKeys: [
      {
        columns: 'event_id',
        references: 'events(id)',
        onDelete: 'set null',
      },
    ],
  });

  pgm.createIndex('routes', ['event_id']);
};

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  pgm.dropTable('routes');
};


