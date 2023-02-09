import pkg from'pg'
const {Pool} = pkg;
import {DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER} from './config.js'

export const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT
})

