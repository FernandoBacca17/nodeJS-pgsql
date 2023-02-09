import express from "express";
import bodyParser from "body-parser";
import {pool} from "./db.js";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import jwt from'jsonwebtoken';
import {PORT} from "./config.js";

dotenv.config();
const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) =>{
    res.send('Welcome');
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
                message: "Usuario o contraseña incorrectos"
            }
        })
    }
    const user = result.rows[0];
    // Valida que la contraseña escrita por el usuario, sea la almacenada en la db
    if (! bcrypt.compareSync(password, user.password)){
        return res.status(400).json({
           ok: false,
           err: {
             message: "Usuario o contraseña incorrectos"
           }
        });
    }
    // Genera el token de autenticación
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let expiresIn = process.env.CADUCIDAD_TOKEN;
    const token = jwt.sign( { usuario: user }, jwtSecretKey, {expiresIn: expiresIn});
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.json({
        ok: true,
        usuario: user,
        token,
    })
})

app.listen(PORT);