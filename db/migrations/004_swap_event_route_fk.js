/* eslint-disable camelcase */
/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.up = (pgm) => {
  // 1) Add events.route_id
  pgm.addColumn('events', {
    route_id: { type: 'integer', notNull: false }
  })

  // 2) Backfill events.route_id from routes.event_id
  pgm.sql(`
    update events e
    set route_id = r.id
    from routes r
    where r.event_id = e.id
  `)

  // 3) Add FK events(route_id) -> routes(id)
  pgm.addConstraint('events', 'events_route_fk', {
    foreignKeys: [
      {
        columns: 'route_id',
        references: 'routes(id)',
        onDelete: 'set null'
      }
    ]
  })

  // 4) Index for faster joins
  pgm.createIndex('events', ['route_id'])

  // 5) Drop routes -> events FK and column
  pgm.dropConstraint('routes', 'routes_event_fk')
  pgm.dropColumn('routes', 'event_id')
}

/** @param {import('node-pg-migrate').MigrationBuilder} pgm */
exports.down = (pgm) => {
  // 1) Recreate routes.event_id
  pgm.addColumn('routes', {
    event_id: { type: 'integer', notNull: false }
  })

  // 2) Backfill routes.event_id from events.route_id
  pgm.sql(`
    update routes r
    set event_id = e.id
    from events e
    where e.route_id = r.id
  `)

  // 3) Recreate FK routes(event_id) -> events(id)
  pgm.addConstraint('routes', 'routes_event_fk', {
    foreignKeys: [
      {
        columns: 'event_id',
        references: 'events(id)',
        onDelete: 'set null'
      }
    ]
  })

  // 4) Drop events FK and column
  pgm.dropConstraint('events', 'events_route_fk')
  pgm.dropIndex('events', ['route_id'])
  pgm.dropColumn('events', 'route_id')
}


