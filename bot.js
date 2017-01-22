const Telegraf = require('telegraf')

const https = require('https');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path')

// Helper methods

var dl_file = function (url, dest, finallyFn) {
	const dirname = path.dirname(dest);
	mkdirp(dirname, function (err) {
		if (err) {
			if (finallyFn) finallyFn(err.message);
		}
		else {
			var file = fs.createWriteStream(dest);
			var request = https.get(url, function (response) {
				response.pipe(file);
				file.on('finish', function () {
					file.close(finallyFn);  // close() is async, call callback after close completes.
				});
			}).on('error', function (err) { // Handle errors
				fs.unlink(dest); // Delete the file async. (But we don't check the result)
				if (finallyFn) finallyFn(err.message);
			});
		}
	});
};

// setup
const config = require('./config.json');

const key = require('./key.json').key;
const app = new Telegraf(key, { username: 'NeonMikaBot' })

// context extension
app.context.files = {
	download: (ctx, file_id, finallyFn) => {
		const filePromise = ctx.telegram.getFile(file_id);
		filePromise.then((file_info) => {
			// file_info format:
			// { file_id: 'AgADBAADu6cxG7R7rREShDYS5xOZdr0BZhkABHAPMSP49tgRoQQEAAEC',
			//   file_size: 45815,
			//   file_path: 'photo/file_5.jpg' }

			const telegram_download_path = `https://api.telegram.org/file/bot${key}/${file_info.file_path}`;

			dl_file(telegram_download_path, path.join(config.dest_folder, file_info.file_id + "." + file_info.file_path.split('.').pop()), finallyFn);
		});
	}
}

// processing methods
function processFile(file_id, ctx, next) {
	return next().then(() => {

		ctx.files.download(ctx, file_id, (e) => {
			if (e) {
				console.error(e);
				ctx.reply(e);
			} else {
				if(config.responses) {
				  ctx.reply('File saved on server');
				}
			}
		});
	});
}

// use
app.use((ctx, next) => {
	const start = new Date()
	console.log('Context message: %s', JSON.stringify(ctx.message));
	return next().then(() => {
		const ms = new Date() - start;
		console.log('Response time %sms', ms);
	})
})

// on
app.on('text', (ctx, next) => {
	return next().then(() => {
		if(responses) {
		  ctx.reply("Received your message!");
		}
	})
});

app.on('document', (ctx, next) => {
	return processFile(ctx.message.document.file_id, ctx, next)
})

app.on('photo', (ctx, next) => {
	const largeImageInfo = ctx.message.photo[ctx.message.photo.length - 1];
	console.log('Photo info: %s', JSON.stringify(largeImageInfo));

	return processFile(largeImageInfo.file_id, ctx, next);
});

// hears
app.hears('Hey Picture-Bot', (ctx, next) => {
	return next().then(() => {
		if(config.responses) {
		  ctx.reply(`Hey ${ctx.message.from.username}!`);
		}
	});
})

// command
app.command('start', (ctx, next) => {
	return next().then(() => {
		if(config.responses) {
		  ctx.reply('No need to start me ;)');
		}
	});
});

app.startPolling()