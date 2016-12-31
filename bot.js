const Telegraf = require('telegraf')

const app = new Telegraf('315764303:AAG_UfV0Mv-aMYeGxetKLCTRgXfJDk8BrJ4')

app.command('start', (ctx) => {
    console.log('start', ctx.from)
    ctx.reply('Welcome!')
})

app.hears('hi', (ctx) => ctx.reply('Hey there!'))
app.on('photo', (ctx) => {
	console.log(ctx.message.photo);
	const largeImage = ctx.message.photo[ctx.message.photo.length-1];
	ctx.reply(largeImage);
})

app.startPolling()