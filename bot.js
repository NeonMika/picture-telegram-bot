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

// Main

const token = '315764303:AAG_UfV0Mv-aMYeGxetKLCTRgXfJDk8BrJ4';

const app = new Telegraf(token, { username: 'NeonMikaBot' })

app.context.files = {
	download: (ctx, file_id, finallyFn) => {
		const filePromise = ctx.telegram.getFile(file_id);
		filePromise.then((file_info) => {
			// file_info format:
			// { file_id: 'AgADBAADu6cxG7R7rREShDYS5xOZdr0BZhkABHAPMSP49tgRoQQEAAEC',
			//   file_size: 45815,
			//   file_path: 'photo/file_5.jpg' }

			const telegram_download_path = `https://api.telegram.org/file/bot${token}/${file_info.file_path}`;

			dl_file(telegram_download_path, file_info.file_path, finallyFn);
		});
	}
}

// use
app.use((ctx, next) => {
	const start = new Date()
	return next().then(() => {
		const ms = new Date() - start
		console.log('Response time %sms', ms)
	})
})

// on
app.on('text', (ctx, next) => {
	return next().then(() => {
		ctx.reply(ctx.message);
	})
});

app.on('photo', (ctx, next) => {
	return next().then(() => {
		// console.log(ctx.message.photo);
		const largeImageInfo = ctx.message.photo[ctx.message.photo.length - 1];
		ctx.reply(largeImageInfo);

		ctx.files.download(ctx, largeImageInfo.file_id, (e) => {
			if (e) {
				console.error(e);
			}
		});
	});
});

// hears
app.hears('hi', (ctx, next) => {
	return next().then(() => {
		ctx.reply('Hey there!');
	});
})

// command
app.command('start', (ctx, next) => {
	return next().then(() => {
		console.log('start', ctx.from)
		ctx.reply('Welcome!')
	});
});

app.startPolling()