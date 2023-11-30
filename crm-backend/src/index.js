const express = require('express')
const cors = require('cors')
const userRouter = require('./routes/user.routes')

// Абсолютный путь каталога /src приложения
global.APP_ROOT = process.main ? process.main.paths[0].split('node_modules')[0] : process.mainModule.paths[0].split('node_modules')[0];

// Менеджер компонентов приложения
global.AppComponents = require(APP_ROOT + 'utils/appComponents.js');

// Конфигурация приложения
AppComponents.registerComponent(
	'config',
	APP_ROOT + 'config'
);
// Модель клиента, использующая для хранения данных JSON-файл
AppComponents.registerComponent(
	'clientModel',
	APP_ROOT + 'models/ClientPostgressModel.js'
);
// Баннер
AppComponents.registerComponent(
	'banner',
	APP_ROOT + 'utils/banner.js'
);

const PORT = AppComponents.getComponent('config').port;
const banner = AppComponents.getComponent('banner');

const app = express()

app.use(express.json({type: '*/*'}))
app.use(cors())
app.use('/api', userRouter)

app.listen(PORT, () => console.log(`${banner}`))

