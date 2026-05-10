const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: config.app.isDev ? console.log : false, // log SQL in dev, silence in prod
  pool: {
    max: 10, // max 10 simultaneous DB connections
    min: 0,
    acquire: 30000, // max time (ms) to acquire a connection before throwing error
    idle: 10000, // close unused connection after 10s
  },
});

const connectDB = async () => {
  await sequelize.authenticate();
  console.log('✅ PostgreSQL connected');
};

module.exports = {
  sequelize,
  connectDB,
};
