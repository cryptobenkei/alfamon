let spinner: any = null;
function title(label: string) {
  console.log('\n\x1b[36m%s\x1b[0m', label);
}

function log(label: string, value: any) {
  console.log('%s\x1b[32m%s\x1b[0m', label, value);
}

function help(label: string, value: string) {
    console.log('\x1b[32m%s\x1b[0m : %s', label, value);
}

function error(label: string) {
    console.log('\x1b[31mError : \x1b[0m : %s', label);
    process.exit();
}


function spinStart(label) {
    let i = 0;
    spinner = setInterval(() => {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        i = (i + 1) % 4;
        const dots = new Array(i + 1).join(".");
        process.stdout.write(label + dots);
    }, 500);
}

function spinStop() {
    clearInterval(spinner);
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
}

function logData(collection) {
    log('Name             : ', collection.name);
    log('Symbol           : ', collection.symbol);
    log('Description      : ', collection.description);
    log('Chain            : ', collection.chainId);
    log('Path             : ', collection.path);
    log('Image            : ', collection.image);
}

export { title, log, logData, help, error, spinStart, spinStop};
  