i = (...msg) => {
    console.log(msg);
}

d = (...msg) => {
    console.log(msg);
}

e = (...msg) => {
    console.error(msg);
}


module.exports = {
    i: i,
    d: d,
    e: e
}