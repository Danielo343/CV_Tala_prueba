const bcrypt = require('bcryptjs');

const password = 'asd123'; // Cambia esto por una contraseña segura
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

console.log('Tu contraseña en texto plano:', password);
console.log('Tu HASH para la base de datos es:', hash);