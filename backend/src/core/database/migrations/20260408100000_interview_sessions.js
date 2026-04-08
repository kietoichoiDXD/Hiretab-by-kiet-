// @ts-check
/**
 * @param {import("knex")} knex
 */
const sessionTable = 'interview_sessions';
const messageTable = 'interview_session_messages';
const eventTable = 'interview_session_events';
const reportTable = 'interview_session_reports';

exports.up = async knex => {
    await knex.schema.createTable(sessionTable, table => {
        table.increments('id').primary();
        table.uuid('session_key').notNullable().index();
        table.integer('candidate_id').unsigned().nullable().index().references('id').inTable('candidates');
        table.jsonb('candidate_snapshot').defaultTo(null);
        table.jsonb('job_snapshot').defaultTo(null);
        table.jsonb('analysis_snapshot').defaultTo(null);
        table.jsonb('interview_plan').defaultTo(null);
        table.string('resume_file', 500).defaultTo(null);
        table.text('resume_text').defaultTo(null);
        table.string('status').notNullable().defaultTo('active');
        table.integer('current_question_index').defaultTo(0);
        table.integer('anti_cheat_score').defaultTo(100);
        table.text('summary').defaultTo(null);
        table.integer('score').defaultTo(null);
        table.dateTime('started_at').defaultTo(knex.fn.now());
        table.dateTime('completed_at').defaultTo(null);
        table.dateTime('deleted_at').defaultTo(null);
        table.timestamps(false, true);
    });

    await knex.schema.createTable(messageTable, table => {
        table.increments('id').primary();
        table.integer('session_id').unsigned().notNullable().index().references('id').inTable(sessionTable);
        table.string('sender').notNullable();
        table.text('text').notNullable();
        table.jsonb('metadata').defaultTo(null);
        table.dateTime('deleted_at').defaultTo(null);
        table.timestamps(false, true);
    });

    await knex.schema.createTable(eventTable, table => {
        table.increments('id').primary();
        table.integer('session_id').unsigned().notNullable().index().references('id').inTable(sessionTable);
        table.string('event_type').notNullable();
        table.jsonb('payload').defaultTo(null);
        table.dateTime('deleted_at').defaultTo(null);
        table.timestamps(false, true);
    });

    await knex.schema.createTable(reportTable, table => {
        table.increments('id').primary();
        table.integer('session_id').unsigned().notNullable().unique().index().references('id').inTable(sessionTable);
        table.integer('score').defaultTo(null);
        table.text('summary').defaultTo(null);
        table.jsonb('report_payload').defaultTo(null);
        table.jsonb('recommendations').defaultTo(null);
        table.dateTime('deleted_at').defaultTo(null);
        table.timestamps(false, true);
    });

    await knex.raw(`
   CREATE TRIGGER update_timestamp
   BEFORE UPDATE
   ON ${sessionTable}
   FOR EACH ROW
   EXECUTE PROCEDURE update_timestamp();
 `);
    await knex.raw(`
   CREATE TRIGGER update_timestamp
   BEFORE UPDATE
   ON ${messageTable}
   FOR EACH ROW
   EXECUTE PROCEDURE update_timestamp();
 `);
    await knex.raw(`
   CREATE TRIGGER update_timestamp
   BEFORE UPDATE
   ON ${eventTable}
   FOR EACH ROW
   EXECUTE PROCEDURE update_timestamp();
 `);
    await knex.raw(`
   CREATE TRIGGER update_timestamp
   BEFORE UPDATE
   ON ${reportTable}
   FOR EACH ROW
   EXECUTE PROCEDURE update_timestamp();
 `);
};

exports.down = async knex => {
    await knex.schema.dropTable(reportTable);
    await knex.schema.dropTable(eventTable);
    await knex.schema.dropTable(messageTable);
    await knex.schema.dropTable(sessionTable);
};
