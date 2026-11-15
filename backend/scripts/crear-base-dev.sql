-- crea la base y el usuario de DESARROLLO en el mysql local (puerto 3306).
-- lo corres vos con una cuenta administradora de tu mysql local, por ejemplo:
--   mysql -u root -p < backend/scripts/crear-base-dev.sql
-- solo afecta a tu mysql local. el usuario solo se puede conectar desde esta misma maquina.
-- despues carga el esquema con: mysql -u tucompra_dev -p tucompra_dev < backend/baseDatos.sql

CREATE DATABASE IF NOT EXISTS tucompra_dev CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'tucompra_dev'@'localhost' IDENTIFIED BY 'tucompra_dev';
CREATE USER IF NOT EXISTS 'tucompra_dev'@'127.0.0.1' IDENTIFIED BY 'tucompra_dev';

GRANT ALL PRIVILEGES ON tucompra_dev.* TO 'tucompra_dev'@'localhost';
GRANT ALL PRIVILEGES ON tucompra_dev.* TO 'tucompra_dev'@'127.0.0.1';
