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
  connectionTimeout: 5000,
  requestTimeout: 5000,
};

let pool: sql.ConnectionPool | null = null;
let connectionFailed = false;

async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'Advir';
  
  const masterConfig: sql.config = {
    ...config,
    database: 'master',
  };

  try {
    const masterPool = await sql.connect(masterConfig);
    
    const result = await masterPool.request()
      .input('dbName', sql.NVarChar, dbName)
      .query(`
        SELECT database_id 
        FROM sys.databases 
        WHERE name = @dbName
      `);

    if (result.recordset.length === 0) {
      console.log(`⚙ Base de dados '${dbName}' não existe. Criando...`);
      await masterPool.request()
        .query(`CREATE DATABASE [${dbName}]`);
      console.log(`✓ Base de dados '${dbName}' criada com sucesso`);
    } else {
      console.log(`✓ Base de dados '${dbName}' já existe`);
    }

    await masterPool.close();
  } catch (error) {
    console.error('✗ Erro ao verificar/criar base de dados:', error);
    throw error;
  }
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (connectionFailed) {
    throw new Error('SQL Server connection previously failed');
  }
  
  if (!pool) {
    try {
      await ensureDatabaseExists();
      
      pool = await sql.connect(config);
      console.log('✓ Conectado ao SQL Server com sucesso');
      await initializeTables();
    } catch (error) {
      connectionFailed = true;
      console.error('✗ Falha ao conectar ao SQL Server - usando armazenamento em memória');
      throw error;
    }
  }
  return pool;
}

async function initializeTables() {
  try {
    if (!pool) throw new Error('Pool não inicializado');

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

    console.log('✓ Tabelas SQL Server verificadas/criadas com sucesso');
  } catch (error) {
    console.error('✗ Erro ao criar tabelas:', error);
    throw error;
  }
}

export function isSqlServerAvailable(): boolean {
  return !connectionFailed && pool !== null;
}

export { sql };
