import sql from 'mssql';

const config: sql.config = {
  user: process.env.DB_USERNAME || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'Advir',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Conectado ao SQL Server');
    await initializeTables();
  }
  return pool;
}

async function initializeTables() {
  try {
    const pool = await getPool();

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      )
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='authorized_numbers' AND xtype='U')
      CREATE TABLE authorized_numbers (
        id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        phone VARCHAR(255) NOT NULL UNIQUE,
        label VARCHAR(255) NOT NULL,
        date_added DATETIME NOT NULL DEFAULT GETDATE()
      )
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='messages' AND xtype='U')
      CREATE TABLE messages (
        id VARCHAR(36) PRIMARY KEY DEFAULT NEWID(),
        phone VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        direction VARCHAR(50) NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT GETDATE()
      )
    `);

    console.log('Tabelas verificadas/criadas com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
    throw error;
  }
}

export { sql };
