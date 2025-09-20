import 'dotenv/config';

function env(name, def, cast = v => v) {
  const v = process.env[name] ?? def;
  if (v === undefined) throw new Error(`Missing env: ${name}`);
  return cast(v);
}

export const config = {
  evolution: {
    baseURL: env('EVOLUTION_BASE_URL'),
    instance: env('EVOLUTION_INSTANCE'),
    apiKey: env('EVOLUTION_API_KEY'),
  },
  server: {
    host: env('HOST', 'localhost'),
    port: env('BOT_PORT', 3001, Number),
    publicURL: env('BOT_PUBLIC_URL', ''),
  },
  business: {
    workStartHour: env('WORK_START_HOUR', 9, Number),
    workEndHour: env('WORK_END_HOUR', 17, Number),
    workDays: env('WORK_DAYS', '0,1,2,3,4', s => String(s).split(',').map(x => Number(x.trim()))),
  },
  logLevel: env('LOG_LEVEL', 'info'),
  db: {
    sqlitePath: env('SQLITE_PATH', './db/bot.sqlite')
  }
};
