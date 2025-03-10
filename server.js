const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3030;

// Middleware per parsejar JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connexió a MongoDB
mongoose.connect('mongodb+srv://javiysergimarbol:123qwe@dailyquest.cbai7.mongodb.net/', { 
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => console.log('❌ Error conectando a MongoDB:', err));

// Definición del esquema de tareas
const tascaSchema = new mongoose.Schema({
  title: String,
  category: String,
  status: String,
  score: Number,
  creation_date: Date
});

// Definición del esquema de usuario con tareas
const usuariSchema = new mongoose.Schema({
  usuari_id: String,
  nom: String,
  punts_totals: Number,
  tasques: [tascaSchema]
});

// Modelo de usuario
const Usuari = mongoose.model('Usuari', usuariSchema);

// 📌 Ruta GET: Obtener todos los usuarios con sus tareas (/list)
app.get('/list', async (req, res) => {
  try {
    const usuaris = await Usuari.find({}).lean();
    if (!usuaris || usuaris.length === 0) {
      return res.status(404).json({ message: '⚠️ No hay usuarios en la base de datos.' });
    }
    res.status(200).json(usuaris);
  } catch (err) {
    console.error("🚨 Error obteniendo usuarios:", err);
    res.status(500).json({ message: 'Error obteniendo usuarios', error: err.message });
  }
});

// 📌 Ruta POST: Agregar un usuario con tareas (/add)
app.post('/add', async (req, res) => {
  try {
    const usuari = new Usuari({
      usuari_id: req.body.usuari_id,
      nom: req.body.nom,
      punts_totals: req.body.punts_totals || 0,
      tasques: req.body.tasques || []
    });

    await usuari.save();
    res.status(201).json(usuari);
  } catch (err) {
    res.status(400).json({ message: 'Error creando usuario', error: err.message });
  }
});

// 📌 Ruta GET: Filtrar tareas de usuarios por fecha de creación (/list/:dataini/:datafi)
app.get('/list/:dataini/:datafi', async (req, res) => {
  try {
    const { dataini, datafi } = req.params;

    // Convertir fechas a formato Date
    const fechaInicio = new Date(dataini);
    const fechaFin = new Date(datafi);
    
    // Comprobar si las fechas son válidas
    if (isNaN(fechaInicio) || isNaN(fechaFin)) {
      return res.status(400).json({ message: '⚠️ Formato de fecha inválido. Usa YYYY-MM-DD.' });
    }

    // Buscar usuarios con tareas en el rango de fechas
    const usuaris = await Usuari.find({
      "tasques.creation_date": { $gte: fechaInicio, $lte: fechaFin }
    }).lean();

    if (!usuaris || usuaris.length === 0) {
      return res.status(404).json({ message: '⚠️ No hay usuarios con tareas en este rango de fechas.' });
    }

    res.status(200).json(usuaris);
  } catch (err) {
    console.error("🚨 Error filtrando usuarios por fecha:", err);
    res.status(500).json({ message: 'Error filtrando usuarios por fecha', error: err.message });
  }
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`🚀 Servidor funcionando en http://localhost:${port}`);
});