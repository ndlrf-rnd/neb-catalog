CREATE USER rsl PASSWORD 'rsl' SUPERUSER;

CREATE DATABASE "rsl_test"
  WITH OWNER "rsl"
  ENCODING 'UTF8'
--  LC_COLLATE = 'ru_RU.UTF-8'
--  LC_CTYPE = 'ru_RU.UTF-8'
  TEMPLATE = template0;
