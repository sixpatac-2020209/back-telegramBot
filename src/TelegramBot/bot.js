'USE STRICT'
const { Telegraf } = require('telegraf');
const { Dotenv } = require('dotenv').config();
const axios = require('axios');
const sqlConfig = require('../../configs/sqlConfig');

const { TOKEN, SERVER_URL } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const bot = new Telegraf(TOKEN, { polling: true });
const { validateFile } = require('./utils/validate');


bot.start((ctx) => {

    let name = ctx.from.first_name;
    let surname = ctx.from.last_name
    ctx.reply(`¡Hola ${name} ${surname} es un gusto saludarte!` + '\n'
        + 'Envia o presiona /help para más información'
    );

});

bot.help((ctx) => {
    ctx.reply('Este es un bot de prueba para VENTO.' + '\n');
});

bot.on('photo', async (ctx) => {
    ctx.reply('Has enviado una imagen o foto');
    ctx.reply('Solo se aceptan documentos .pdf o .xlsx (excel)');
});

bot.on('video', (ctx => {
    ctx.reply('Mensaje no apropiado para este bot')
}));

bot.on('voice', (ctx => {
    ctx.reply('Mensaje no apropiado para este bot')
}));

bot.on('sticker', (ctx => {
    ctx.reply('Mensaje no apropiado para este bot')
}));





//---------------------------- REGISTROS ----------------------------//


/*CLIENTE*/
bot.command('register', async (ctx) => {
    try {
        let idGroup = ctx.chat.id;
        let nombreCliente = ctx.from.first_name;
        let apellidoCliente = ctx.from.last_name;

        let validateCliente = await sqlConfig.dbconnection.query(`SELECT nombreCliente FROM telegramClientes WHERE idGroup = '${idGroup}'`);
        let arrayCliente = validateCliente.recordsets;
        let returnCliente = arrayCliente[0];

        if (returnCliente == "" || returnCliente == undefined) {
            let newCliente = await sqlConfig.dbconnection.query(`INSERT INTO telegramClientes VALUES ('${idGroup}', '${nombreCliente}', '${apellidoCliente}')`);
            let arrayNewCliente = newCliente.recordsets;
            let returnNewCliente = arrayNewCliente[0];

            if (!newCliente) {
                ctx.reply('Cliente no guardado');

            } else {
                ctx.reply('Cliente registrado satisfactoriamente', returnNewCliente);
            }

        } else {
            ctx.reply('Cliente registrado Anteriormente');
        }
    } catch (err) {
        console.log(err);
        ctx.reply('Error al guardar el cliente')
    }
});


/*VENDEDOR*/
bot.command('idVendedor', async (ctx) => {
    try {
        let idGroup = ctx.chat.id;
        let nombreVendedor = ctx.from.first_name;
        let apellidoVendedor = ctx.from.last_name;

        let validateVendedor = await sqlConfig.dbconnection.query(`SELECT nombreVendedor FROM vendedores WHERE idGroup = '${idGroup}'`);
        let arrayVendedor = validateVendedor.recordsets;
        let returnVendedor = arrayVendedor[0];
        if (returnVendedor == "" || returnVendedor == undefined) {
            let newVendedor = await sqlConfig.dbconnection.query(`INSERT INTO vendedores VALUES ('${idGroup}', '${nombreVendedor}', '${apellidoVendedor}')`);
            let arrayNewVendedor = newVendedor.recordsets;
            let returnNewVendedor = arrayNewVendedor[0];

            if (!newVendedor) {
                ctx.reply('Vendedor no guardado');

            } else {
                ctx.reply('Vendedor registrado satisfactoriamente', returnNewVendedor);
            }

        } else {
            ctx.reply('Vendedor registrado Anteriormente');
        }
    } catch (err) {
        console.log(err);
        ctx.reply('Error al guardar el Vendedor')
    }
});


//___________________________________________________________________//





//---------------------------- CLIENTE ----------------------------//


bot.command('initBot', async(ctx) => {
    let userId = ctx.chat.id;
    let cliente = await sqlConfig.dbconnection.query(`SELECT nombreCliente, apellidoCliente FROM telegramClientes WHERE idGroup = '${userId}'`);
    let arrayCliente = cliente.recordsets;
    let returnCliente = arrayCliente[0];
    if (!returnCliente || returnCliente === [] || returnCliente === undefined || returnCliente == '') {
        ctx.reply('Comnando no autorizado');
    } else {
        if (!returnCliente || returnCliente === [] || returnCliente === undefined || returnCliente == '') {
            ctx.reply('Comando no autorizado')
        } else {
            ctx.reply('Envie su pedido');
            bot.on('document', async (ctx) => {
                let fileURL = await bot.telegram.getFileLink(ctx.update.message.document.file_id);
                let fileExtention = fileURL.pathname.split('.');
                const verificExtention = await validateFile(fileExtention[1]);

                let fileId = ctx.message.document.file_id
                let documentPath = fileURL.pathname;
                let documentName = ctx.message.document.file_name;
                let documentCaption = ctx.message.caption;

                if (verificExtention === true) {
                    ctx.reply('Envia el nombre del vendedor');

                    bot.on('text', async (ctx) => {
                        let Vendedor = ctx.message.text;
                        let splitVendedor = Vendedor.split(' ');
                        let nombreVendedor = splitVendedor[0];
                        let apellidoVendedor = splitVendedor[1];

                        let chatVendedor = await sqlConfig.dbconnection.query(`SELECT  idGroup FROM vendedores WHERE nombreVendedor='${nombreVendedor}' and apellidoVendedor='${apellidoVendedor}'`);
                        let arrayChatVendedor = chatVendedor.recordsets;
                        let returnChatVendedor = arrayChatVendedor[0];

                        let idChat = []
                        let array = returnChatVendedor;
                        for (item of array) {
                            idChat.push(item.idGroup);
                        }
                        let idChatString = idChat.toString();


                        bot.telegram.sendDocument(idChatString, fileId, documentPath);
                        bot.telegram.sendMessage(idChatString, `Documento: ${documentName}.\nEmpresa: ${documentCaption}\nEnviado por ${ctx.from.first_name} ${ctx.from.last_name}`);

                        ctx.reply('Se ha confirmado tu pedido' + '\n'
                            + 'Por favor espera la confirmación de nuestro encargado.'
                        );
                    });

                } else {
                    ctx.reply('El archivo enviado no es valido');
                }
            });
        }

    }

});


//___________________________________________________________________//



//---------------------------- VENDEDOR ----------------------------//


bot.command('confirmCliente', async (ctx) => {
    let nombreVendedor = ctx.from.first_name;
    let apellidoVendedor = ctx.from.last_name;

    const Vendedor = await sqlConfig.dbconnection.query(`SELECT idGroup FROM vendedores WHERE nombreVendedor = '${nombreVendedor}' AND apellidoVendedor = '${apellidoVendedor}'`);
    let arrayVendedor = Vendedor.recordsets;
    let returnVendedor = arrayVendedor[0];
    console.log(returnVendedor)
    if (!returnVendedor || returnVendedor === [] || returnVendedor === undefined || returnVendedor == '') {
        ctx.reply('Comando no autorizado');
    } else {

        ctx.reply('Envia el nombre del cliente');

        bot.on('text', async (ctx) => {
            let toCliente = ctx.message.text
            let splitCliente = toCliente.split(' ');
            let nombreCliente = splitCliente[0];
            let apellidoCliente = splitCliente[1];

            let cliente = await sqlConfig.dbconnection.query(`SELECT idGroup FROM telegramClientes WHERE nombreCliente = '${nombreCliente}' AND apellidoCliente = '${apellidoCliente}'`)
            let arrayCliente = cliente.recordsets;
            let returnCliente = arrayCliente[0];

            let idChat = []
            let array = returnCliente;
            for (item of array) {
                idChat.push(item.idGroup);
            }
            let idChatString = idChat.toString();

            let message_Cont = `Pedido confirmado por ${ctx.from.first_name} ${ctx.from.last_name}. Se ha confirmado tu pedido por parte de VENTO SA, tu pedido fue puesto en cola de verificación`
            bot.telegram.sendMessage(idChatString, message_Cont);
            ctx.reply('Mensaje enviado al cliente');
        });
    }
});


bot.command('enviarSAE', async (ctx) => {
    let userId = ctx.chat.id
    let userIdString = userId.toString();

    let validateUser = await sqlConfig.dbconnection.query(`SELECT nombreVendedor, apellidoVendedor FROM vendedores WHERE idGroup = '${userIdString}'`);
    let arrayVendedor = validateUser.recordsets;
    let returnVendedor = arrayVendedor[0];
    let idChat = []
    let array = returnVendedor;
    for (item of array) {
        idChat.push(item.nombreVendedor + ' ' + item.apellidoVendedor);
    }
    let vendedortring = idChat.toString();

    if (!returnVendedor || returnVendedor === [] || returnVendedor === undefined || returnVendedor == '') {
        ctx.reply('Comando no autorizado');
    } else {
        ctx.reply('Envia el documento SAE');
        bot.on('document', async (ctx) => {
            let fileURL = await bot.telegram.getFileLink(ctx.update.message.document.file_id);
            let fileExtention = fileURL.pathname.split('.');
            const verificExtention = await validateFile(fileExtention[1]);

            let fileId = ctx.message.document.file_id
            let documentPath = fileURL.pathname;
            let file_name = ctx.message.document.file_name

            if (verificExtention === true) {
                let groupId = '1908891995';
                bot.telegram.sendDocument(groupId, fileId, documentPath);
                bot.telegram.sendMessage(groupId, `Documento: ${file_name} , enviado por ${vendedortring}`)
                ctx.reply('documento enviado satisfactoriamente');
            } else {
                ctx.reply('El archivo enviado no es valido');
            }
        });

    }

});


//___________________________________________________________________//





//---------------------------- JEFE ----------------------------//


bot.command("sendDB", (ctx) => {
    let chatIdConf = ctx.chat.id;
    let chatIdString = chatIdConf.toString()
    if (chatIdConf === 1908891995 || chatIdString === '1908891995') {
        ctx.reply('Por favor enviar el documento pdf con el nombre de la empresa como comentario');

        if (chatIdConf === /*idChat del Jefe*/ 1908891995 || chatIdString === /*idChat del Jefe*/ '1908891995') {

            bot.on('document', async (ctx) => {
                let fileURL = await bot.telegram.getFileLink(ctx.update.message.document.file_id);
                let fileExtention = fileURL.pathname.split('.');
                const verificExtention = await validateFile(fileExtention[1]);
                let fileId = ctx.message.document.file_id
                let documentPath = fileURL.pathname;
                let documentName = ctx.message.document.file_name;
                let documentCaption = ctx.message.caption;

                if (verificExtention === true) {
                    try {
                        let data = {
                            urlDocumento: fileURL.href,
                            nombreDocumento: ctx.message.document.file_name,
                            empresa: ctx.message.caption
                        };
                        const newDocument = await sqlConfig.dbconnection.query(`INSERT INTO documentos 
                            VALUES ('${data.urlDocumento}', '${data.nombreDocumento}', '${data.empresa}')`);

                        let arrayNewDocumento = newDocument.recordsets;
                        let returnNewDocumento = arrayNewDocumento[0];

                        if (!newDocument) {
                            ctx.reply('documento no guardado')
                        }
                        else {
                            ctx.reply('Documento guardado satisfactoriamente', returnNewDocumento);
                            // ENVIO DE CONFIRMACIÓN AL GRUPO
                            let groupId = '-1001733373558';
                            bot.telegram.sendDocument(groupId, fileId, documentPath);
                            bot.telegram.sendMessage(groupId, `Documento: ${documentName}.\nEmpresa: ${documentCaption},\nConfirmado y puesto en produccion`);
                        }
                    } catch (err) {
                        console.log(err);
                        ctx.reply('Error al guardar el documento')
                    }

                } else {
                    ctx.reply('El archivo enviado no es valido');
                }

            });
        }
    } else {
        ctx.reply('Comando no autorizado');
    }
});


bot.command("confirm", (ctx) => {
    let chatId = ctx.chat.id;
    if (chatId === -1001733373558 || chatId === 1908891995 /** idChat del Jefe */) {

        ctx.reply('utilice el comando /cliente o /vendedor para enviar la confirmación')
        bot.command('cliente', async (ctx) => {
            ctx.reply('Envie el nombre del cliente a confirmar');
            bot.on('text', async (ctx) => {
                let Cliente = ctx.message.text;
                let splitCliente = Cliente.split(' ');
                let nombreCliente = splitCliente[0];
                let apellidoCliente = splitCliente[1];

                let chatCliente = await sqlConfig.dbconnection.query(`SELECT idGroup FROM telegramClientes WHERE nombreCliente='${nombreCliente}' and apellidoCliente='${apellidoCliente}'`);
                let arrayChatCliente = chatCliente.recordsets;
                let returnChatCliente = arrayChatCliente[0];

                let idChat = []
                let array = returnChatCliente;
                for (item of array) {
                    idChat.push(item.idGroup);
                }
                let idChatString = idChat.toString();
                bot.telegram.sendMessage(idChatString, `Su pedido a sido puesto en cola de producción`);
                ctx.reply('mensaje enviado el Cliente');

            });
        });

        bot.command('vendedor', async (ctx) => {
            ctx.reply('Envie el nombre del vendedor a confirmar');
            bot.on('text', async (ctx) => {
                let Vendedor = ctx.message.text;
                let splitVendedor = Vendedor.split(' ');
                let nombreVendedor = splitVendedor[0];
                let apellidoVendedor = splitVendedor[1];

                let chatVendedor = await sqlConfig.dbconnection.query(`SELECT idGroup FROM vendedores WHERE nombreVendedor='${nombreVendedor}' and apellidoVendedor='${apellidoVendedor}'`);
                let arrayChatVendedor = chatVendedor.recordsets;
                let returnChatVendedor = arrayChatVendedor[0];

                let idChat = []
                let array = returnChatVendedor;
                for (item of array) {
                    idChat.push(item.idGroup);
                }
                let idChatString = idChat.toString();
                bot.telegram.sendMessage(idChatString, `Pedido de Sduard Sipaque confirmado y puesto en producción`);
                ctx.reply('Mensaje enviado al Vendedor');
                bot.stop('text');

            });
            bot.stop('vendedor');
        });

    } else {
        ctx.reply('Comando no autorizado');
    }
});

//___________________________________________________________________//


bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

exports.init = async () => {
    const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
    console.log('TelegramBot | In function.');
};