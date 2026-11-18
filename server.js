
const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: {},
    waitForConnections: true,
    connectionLimit: 10
});

// Comprobar conexión con la base de datos
app.get('/api/estado', async (req, res) => {
    try {
        const conexion = await db.getConnection();
        await conexion.query('SELECT 1');
        conexion.release();

        res.json({
            mensaje: 'Conexión con la base de datos exitosa'
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            mensaje: 'No fue posible conectar con la base de datos'
        });
    }
});

// Registrar una cita
app.post('/api/citas', async (req, res) => {
    try {
        const { nombre, documento, servicio, fecha, hora } = req.body;

        if (!nombre || !documento || !servicio || !fecha || !hora) {
            return res.status(400).json({
                mensaje: 'Todos los campos son obligatorios'
            });
        }

        const sql = `
            INSERT INTO citas (nombre, documento, servicio, fecha, hora)
            VALUES (?, ?, ?, ?, ?)
        `;

        const [resultado] = await db.execute(sql, [
            nombre,
            documento,
            servicio,
            fecha,
            hora
        ]);

        res.status(201).json({
            mensaje: 'Cita registrada correctamente',
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            mensaje: 'Error al registrar la cita'
        });
    }
});

// Consultar las citas registradas
app.get('/api/citas', async (req, res) => {
    try {
        const [citas] = await db.query(
            'SELECT * FROM citas ORDER BY fecha DESC, hora DESC'
        );

        res.json(citas);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            mensaje: 'Error al consultar las citas'
        });
    }
});

app.listen(process.env.PORT, '0.0.0.0', () => {
    console.log(`Servidor MediAgenda activo en el puerto ${process.env.PORT}`);
});
