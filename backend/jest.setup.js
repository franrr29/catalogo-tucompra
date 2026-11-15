// se ejecuta antes de cada archivo de test, antes de que nada cargue dotenv.
// dotenv no pisa las variables que ya existen, asi que el .env local (que podria apuntar a produccion)
// nunca llega a los tests: ni NODE_ENV ni DATABASE_URL salen de ahi
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "mysql://tucompra_test:tucompra_test@127.0.0.1:3306/tucompra_test";
