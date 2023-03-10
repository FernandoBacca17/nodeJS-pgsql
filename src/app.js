import express from "express";
import bodyParser from "body-parser";
import {pool} from "./db.js";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import jwt from'jsonwebtoken';
import {PORT} from "./config.js";

dotenv.config();
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, gfg_token_header_key');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    // Pass to next layer of middleware
    next();
});

app.get('/', (req, res) =>{
    res.json({message: 'Bienvenido'});
})

app.get('/users', async (req, res) =>{
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
  
    try {
        const token = req.header(tokenHeaderKey);
  
        const verified = jwt.verify(token, jwtSecretKey);
        if(verified){
            const result = await pool.query(`select * from users`);
            res.json(result.rows);
        }else{
            // Access Denied
            return res.status(401).send(error);
        }
    } catch (error) {
        // Access Denied
        return res.status(401).send(error);
    }
})

app.post('/users', async (req, res) =>{
    let data = req.body;
    const {name, last_name, email, password} = data;
    const pass = await bcrypt.hash(password, 10);

    const result = await pool.query(`INSERT INTO users (name, last_name, email, password) VALUES ($1, $2, $3, $4)`, [name, last_name, email, pass]);

    res.json(result.rowCount);
})

app.post('/login', async (req, res) =>{
    let data = req.body;
    const {email, password} = data;
    //Verificar si el usuario existe
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    //console.log(result);
    if(result.rowCount === 0){
        return res.status(400).json({
            ok: false,
            err: {
                message: "Usuario o contrase??a incorrectos"
            }
        })
    }
    const user = result.rows[0];
    // Valida que la contrase??a escrita por el usuario, sea la almacenada en la db
    if (! bcrypt.compareSync(password, user.password)){
        return res.status(400).json({
           ok: false,
           err: {
             message: "Usuario o contrase??a incorrectos"
           }
        });
    }
    // Genera el token de autenticaci??n
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let expiresIn = process.env.CADUCIDAD_TOKEN;
    const token = jwt.sign( { usuario: user }, jwtSecretKey, {expiresIn: expiresIn});
    res.json({
        ok: true,
        usuario: user,
        token,
    })
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});