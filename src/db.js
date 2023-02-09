import pkg from'pg'
const {Pool} = pkg;

export const pool = new Pool({
    user: 'postgres',
    host: 'containers-us-west-200.railway.app',
    database: 'railway',
    password: 'oeg8VAXhxhhvhsTIZBEn',
    port: 6294
})

